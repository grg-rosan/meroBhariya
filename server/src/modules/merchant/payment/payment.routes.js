// server/src/routes/wallet.route.js

import express from "express";
import { initiateTopup, verifyTopup } from "../controllers/wallet.controller.js";
import { protect, merchantOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// merchant initiates top-up
router.post("/topup/initiate", protect, merchantOnly, initiateTopup);

// Khalti calls this after payment — no auth, Khalti hits this directly
router.get("/topup/verify", verifyTopup);

export default router;