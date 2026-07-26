import express from "express";
import usersController from "../../controllers/users.controller.js";
import requireAuth from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", usersController.register); // Register a new user
router.post("/login", usersController.login); // Log in and receive auth cookies
router.post("/refresh", usersController.refresh); // Rotate refresh token, issue new access token
router.post("/logout", usersController.logout); // Invalidate the current refresh token
router.get("/me", requireAuth, usersController.me); // Get the authenticated user's profile

export default router;
