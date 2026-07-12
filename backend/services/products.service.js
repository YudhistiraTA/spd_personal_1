import { ObjectId } from "mongodb";
import products, { Product } from "../models/products.model.js";

/**
 * Get paginated list of products
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{data: Product[], pagination: {total: number, page: number, limit: number, totalPages: number}}>}
 */
const getProducts = async (page, limit) => {
  const skip = (page - 1) * limit;
  const pipeline = [
    {
      $addFields: {
        rating: { $ifNull: [{ $avg: "$reviews.rating" }, 0] },
      },
    },
    { $project: { reviews: 0 } },
    { $skip: skip },
    { $limit: limit },
    { $match: { isDeleted: false } },
  ];
  const [data, total] = await Promise.all([
    products.aggregate(pipeline).toArray(),
    products.countDocuments({ isDeleted: false }),
  ]);
  const items = data.map((doc) => new Product(doc));
  return {
    data: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single product by slug
 * @param {string} slug - Product slug
 * @returns {Promise<Product|null>} - Returns the product or null if not found
 */
const getProductBySlug = async (slug) => {
  const pipeline = [
    { $match: { slug, isDeleted: false } },
    {
      $addFields: {
        rating: { $ifNull: [{ $avg: "$reviews.rating" }, 0] },
      },
    },
    { $limit: 1 },
  ];
  const [doc] = await products.aggregate(pipeline).toArray();
  if (!doc) return null;
  return new Product(doc);
};

/**
 * Create a new product
 * @param {Product} data - Product data
 * @returns {Promise<Product>} - Returns the created product
 */
const createProduct = async (data) => {
  const product = new Product(data);
  const errors = product.validate();
  if (errors.length > 0) {
    const err = new Error("Validation failed");
    err.validationErrors = errors;
    throw err;
  }
  const doc = product.sanitize();
  doc.slug = doc.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  doc.isDeleted = false;
  const existing = await products.findOne({ slug: doc.slug, isDeleted: false });
  if (existing) {
    const err = new Error("A product with this name already exists");
    err.conflict = true;
    throw err;
  }
  const result = await products.insertOne(doc);
  return { ...doc, _id: result.insertedId };
};

/**
 * Update a product by ID with the provided fields
 * @param {string} id - Product ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Product|null>} - Returns the updated product or null if not found
 */
const updateProduct = async (id, data) => {
  const protectedFields = ["_id", "isDeleted"];
  const updateData = {};
  for (const [key, value] of Object.entries(data)) {
    if (!protectedFields.includes(key)) updateData[key] = value;
  }

  if (Object.keys(updateData).length === 0) {
    const err = new Error("No valid fields to update");
    err.validationErrors = ["No valid fields provided"];
    throw err;
  }

  const errors = Product.validatePartial(updateData);
  if (errors.length > 0) {
    const err = new Error("Validation failed");
    err.validationErrors = errors;
    throw err;
  }

  const result = await products.findOneAndUpdate(
    { _id: new ObjectId(id), isDeleted: false },
    { $set: updateData },
    { returnDocument: "after" },
  );
  if (!result) return null;
  return new Product(result);
};

/**
 * Soft delete a product by ID
 * @param {string} id - Product ID
 * @returns {Promise<Product|null>} - Returns the deleted product or null if not found
 */
const softDeleteProduct = async (id) => {
  const result = await products.findOneAndUpdate(
    { _id: new ObjectId(id), isDeleted: false },
    { $set: { isDeleted: true } },
    { returnDocument: "after" },
  );
  return result ?? null;
};

export default {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  softDeleteProduct,
};
