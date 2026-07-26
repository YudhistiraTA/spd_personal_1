import express from "express";
import productsRoutes from "./products.routes.js";
import usersRoutes from "./users.routes.js";

const router = express.Router();

router.use("/products", productsRoutes);
router.use("/users", usersRoutes);

export default router;