import express from "express";
import { register, login, logout, changePassword } from "../auth/auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/change-password", authMiddleware, changePassword); // protected ✓

export default router;