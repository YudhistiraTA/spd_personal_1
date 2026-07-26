import db from "../db/index.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const refreshTokenSchema = {
  tokenHash: { type: "string", required: true },
  expiresAt: { type: "string", required: true },
  createdAt: {
    type: "string",
    required: false,
    default: () => new Date().toISOString(),
  },
};

const schema = {
  name: { type: "string", required: true },
  email: { type: "string", required: true },
  passwordHash: { type: "string", required: true },
  refreshTokens: { type: "array", required: false, default: [] },
  isDeleted: { type: "boolean", required: false, default: false },
};

const typeCheckers = {
  string: (v) => typeof v === "string",
  number: (v) => typeof v === "number" && !isNaN(v),
  boolean: (v) => typeof v === "boolean",
  array: (v) => Array.isArray(v),
};

/**
 * @class RefreshTokenEntry
 * @description Represents a stored (hashed) refresh token issued to a user, embedded in the user document.
 * @property {string} tokenHash - SHA-256 hash of the refresh token (required).
 * @property {string} expiresAt - ISO timestamp of when the refresh token expires (required).
 * @property {string} createdAt - ISO timestamp of when the refresh token was issued (optional, defaults to now).
 */
export class RefreshTokenEntry {
  constructor(doc = {}) {
    for (const [field, rules] of Object.entries(refreshTokenSchema)) {
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
    for (const [field, rules] of Object.entries(refreshTokenSchema)) {
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
    for (const field of Object.keys(refreshTokenSchema)) {
      if (this[field] !== undefined) result[field] = this[field];
    }
    return result;
  }
}

/**
 * @class User
 * @description Represents a user document in the database.
 * @property {string} name - The user's display name (required).
 * @property {string} email - The user's email address, used as the login identifier (required, unique).
 * @property {string} passwordHash - The bcrypt hash of the user's password (required). The plaintext password is never persisted.
 * @property {RefreshTokenEntry[]} refreshTokens - Hashed refresh tokens currently issued to the user (optional, default []).
 * @property {boolean} isDeleted - Indicates if the account is deleted (optional, default: false).
 * @method validate() - Validates the user instance against the schema and returns an array of error messages.
 * @method sanitize() - Returns a plain object containing only the schema-defined fields, suitable for database operations.
 * @method toPublic() - Returns a plain object safe to send to clients (excludes passwordHash and refreshTokens).
 * @method isValid() - Returns true if the user instance is valid, false otherwise.
 */
export class User {
  constructor(doc = {}) {
    for (const [field, rules] of Object.entries(schema)) {
      if (doc[field] !== undefined) {
        this[field] =
          field === "refreshTokens"
            ? doc[field].map((t) => new RefreshTokenEntry(t))
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
      if (
        field === "email" &&
        typeof value === "string" &&
        !EMAIL_REGEX.test(value)
      ) {
        errors.push(`"email" must be a valid email address`);
      }
      if (field === "refreshTokens" && Array.isArray(value)) {
        value.forEach((t, i) => {
          const entry = t instanceof RefreshTokenEntry ? t : new RefreshTokenEntry(t);
          entry.validate().forEach((e) => errors.push(`refreshTokens[${i}]: ${e}`));
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
          field === "refreshTokens"
            ? this[field].map((t) => (t instanceof RefreshTokenEntry ? t.sanitize() : t))
            : this[field];
      }
    }
    return result;
  }

  /** Returns a plain object safe to expose to clients (no passwordHash/refreshTokens). */
  toPublic() {
    return {
      _id: this._id,
      name: this.name,
      email: this.email,
    };
  }

  /** Returns true if the instance is valid, false otherwise. */
  isValid() {
    return this.validate().length === 0;
  }

  /**
   * Validates only the fields present in the provided data object.
   * Protected fields (_id, passwordHash, refreshTokens, isDeleted) are ignored.
   * @param {Object} data - Partial user data to validate
   * @returns {string[]} Array of error messages
   */
  static validatePartial(data) {
    const protectedFields = ["_id", "passwordHash", "refreshTokens", "isDeleted"];
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
      if (field === "email" && typeof value === "string" && !EMAIL_REGEX.test(value)) {
        errors.push(`"email" must be a valid email address`);
      }
    }
    return errors;
  }

  /**
   * Validates a raw plaintext password (before hashing). Not part of the persisted
   * schema since only the bcrypt hash is ever stored.
   * @param {string} password - Plaintext password
   * @returns {string[]} Array of error messages
   */
  static validatePassword(password) {
    const errors = [];
    if (typeof password !== "string" || password.length === 0) {
      errors.push(`"password" is required`);
      return errors;
    }
    if (password.length < 8) {
      errors.push(`"password" must be at least 8 characters long`);
    }
    if (!/[a-zA-Z]/.test(password)) {
      errors.push(`"password" must contain at least one letter`);
    }
    if (!/[0-9]/.test(password)) {
      errors.push(`"password" must contain at least one number`);
    }
    return errors;
  }
}

const users = db.collection("users");

// App-level uniqueness is checked in the service, but a unique index gives a
// DB-level safety net against races between the check and the insert.
await users.createIndex({ email: 1 }, { unique: true });

export default users;
