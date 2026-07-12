import express from "express";
import productsController from "../../controllers/products.controller.js";

const router = express.Router();

router.get("/", productsController.index); // Get paginated list of products
router.post("/", productsController.create); // Create a new product
router.get("/:slug", productsController.show); // Get a single product by slug
router.patch("/:id", productsController.update); // Update a product by ID
router.delete("/:id", productsController.destroy); // Soft delete a product by ID

export default router;