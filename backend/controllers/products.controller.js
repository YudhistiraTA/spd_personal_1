import productService from "../services/products.service.js";

/**
 * Get paginated list of products
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.page=1] - Page number (minimum 1)
 * @param {number} [req.query.limit=10] - Items per page (1-100)
 * @param {Object} res - Express response object
 * @returns {void}
 */
const index = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const result = await productService.getProducts(page, limit);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get a single product by slug
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.slug - Product slug
 * @param {Object} res - Express response object
 * @returns {void}
 */
const show = async (req, res) => {
  try {
    const slug = req.params.slug;
    const product = await productService.getProductBySlug(slug);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Create a new product
 * @param {Object} req - Express request object
 * @param {Product} req.body - Request body
 * @param {Object} res - Express response object
 * @returns {void}
 */
const create = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    if (err.validationErrors) {
      return res
        .status(422)
        .json({ message: "Validation failed", errors: err.validationErrors });
    }
    if (err.conflict) {
      return res.status(409).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update a product by ID with the provided fields
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Product ID
 * @param {Object} req.body - Fields to update
 * @param {Object} res - Express response object
 * @returns {void}
 */
const update = async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await productService.updateProduct(id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(updated);
  } catch (err) {
    if (err.validationErrors) {
      return res
        .status(422)
        .json({ message: "Validation failed", errors: err.validationErrors });
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Soft delete a product by ID
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Product ID
 * @param {Object} res - Express response object
 * @returns {void}
 */
const destroy = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await productService.softDeleteProduct(id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default { index, show, create, update, destroy };
