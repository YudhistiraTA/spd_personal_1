import db from "../db/index.js";

const reviewSchema = {
  createdBy: { type: "string", required: true },
  createdAt: {
    type: "string",
    required: false,
    default: () => new Date().toISOString(),
  },
  rating: { type: "number", required: true },
  comment: { type: "string", required: false, default: "" },
};

const schema = {
  name: { type: "string", required: true },
  price: { type: "number", required: true },
  description: { type: "string", required: false, default: "" },
  stock: { type: "number", required: false, default: 0 },
  image: { type: "string", required: false, default: "" },
  reviews: { type: "array", required: false, default: [] },
  slug: { type: "string", required: false, default: "" },
  rating: { type: "number", required: false, default: 0 },
  isDeleted: { type: "boolean", required: false, default: false },
};

const typeCheckers = {
  string: (v) => typeof v === "string",
  number: (v) => typeof v === "number" && !isNaN(v),
  boolean: (v) => typeof v === "boolean",
  array: (v) => Array.isArray(v),
};

/**
 * @class Review
 * @description Represents a review embedded in a product document.
 * @property {string} createdBy - The author of the review (required).
 * @property {string} createdAt - ISO timestamp of when the review was created (optional, defaults to now).
 * @property {number} rating - The rating given in the review (required).
 * @property {string} comment - The review comment (optional, default: "").
 */
export class Review {
  constructor(doc = {}) {
    for (const [field, rules] of Object.entries(reviewSchema)) {
      if (doc[field] !== undefined) {
        this[field] = doc[field];
      } else if ("default" in rules) {
        this[field] =
          typeof rules.default === "function" ? rules.default() : rules.default;
      } else {
        this[field] = undefined;
      }
    }
  }

  validate() {
    const errors = [];
    for (const [field, rules] of Object.entries(reviewSchema)) {
      const value = this[field];
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`"${field}" is required`);
        continue;
      }
      if (value !== undefined && value !== null && typeCheckers[rules.type]) {
        if (!typeCheckers[rules.type](value)) {
          errors.push(`"${field}" must be of type ${rules.type}`);
        }
      }
    }
    return errors;
  }

  sanitize() {
    const result = {};
    for (const field of Object.keys(reviewSchema)) {
      if (this[field] !== undefined) result[field] = this[field];
    }
    return result;
  }

  isValid() {
    return this.validate().length === 0;
  }
}

/**
 * @class Product
 * @description Represents a product document in the database.
 * @property {string} name - The name of the product (required).
 * @property {number} price - The price of the product (required).
 * @property {string} description - A description of the product (optional, default: "").
 * @property {number} stock - The stock quantity of the product (optional, default: 0).
 * @property {string} image - A URL to an image of the product (optional, default: "").
 * @property {number} rating - The rating of the product (optional, default: 0).
 * @property {Review[]} reviews - An array of reviews for the product (optional, default: []).
 * @property {boolean} isDeleted - Indicates if the product is deleted (optional, default: false).
 * @method validate() - Validates the product instance against the schema and returns an array of error messages.
 * @method sanitize() - Returns a plain object containing only the schema-defined fields, suitable for database operations.
 * @method isValid() - Returns true if the product instance is valid, false otherwise.
 */
export class Product {
  constructor(doc = {}) {
    for (const [field, rules] of Object.entries(schema)) {
      if (doc[field] !== undefined) {
        this[field] =
          field === "reviews"
            ? doc[field].map((r) => new Review(r))
            : doc[field];
      } else if ("default" in rules) {
        this[field] =
          typeof rules.default === "function" ? rules.default() : rules.default;
      } else {
        this[field] = undefined;
      }
    }
    // preserve _id when wrapping a document read from the DB
    if (doc._id !== undefined) this._id = doc._id;
  }

  /** Returns an array of error strings. Empty array means the instance is valid. */
  validate() {
    const errors = [];
    for (const [field, rules] of Object.entries(schema)) {
      const value = this[field];
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`"${field}" is required`);
        continue;
      }
      if (value !== undefined && value !== null && typeCheckers[rules.type]) {
        if (!typeCheckers[rules.type](value)) {
          errors.push(`"${field}" must be of type ${rules.type}`);
        }
      }
      if (field === "reviews" && Array.isArray(value)) {
        value.forEach((r, i) => {
          const review = r instanceof Review ? r : new Review(r);
          review.validate().forEach((e) => errors.push(`reviews[${i}]: ${e}`));
        });
      }
    }
    return errors;
  }

  /** Returns a plain object with only schema-defined fields (safe to pass to insertOne/updateOne). */
  sanitize() {
    const result = {};
    for (const field of Object.keys(schema)) {
      if (this[field] !== undefined) {
        result[field] =
          field === "reviews"
            ? this[field].map((r) => (r instanceof Review ? r.sanitize() : r))
            : this[field];
      }
    }
    return result;
  }

  /** Returns true if the instance is valid, false otherwise. */
  isValid() {
    return this.validate().length === 0;
  }

  /**
   * Validates only the fields present in the provided data object.
   * Protected fields (_id, isDeleted) are ignored.
   * @param {Object} data - Partial product data to validate
   * @returns {string[]} Array of error messages
   */
  static validatePartial(data) {
    const protectedFields = ["_id", "isDeleted"];
    const errors = [];
    for (const [field, value] of Object.entries(data)) {
      if (protectedFields.includes(field)) continue;
      const rules = schema[field];
      if (!rules) continue;
      if (value === undefined || value === null) {
        if (rules.required) errors.push(`"${field}" is required`);
        continue;
      }
      if (typeCheckers[rules.type] && !typeCheckers[rules.type](value)) {
        errors.push(`"${field}" must be of type ${rules.type}`);
      }
    }
    return errors;
  }
}

const products = db.collection("products");

export default products;
