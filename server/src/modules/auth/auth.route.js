import express from "express";
import { register,login,logout } from "../auth/auth.controller.js";

const router = express.Router();

router.post("/register", register);

router.post("/login",login)

router.post("/logout",logout)

router.post("/")

export default router;