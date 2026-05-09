// src/modules/merchant/wallet/wallet.routes.js
// requireAuth + requireMerchantProfile already applied by merchant.routes.js
// Do NOT add them here — double middleware causes ordering issues.

import { Router } from "express";
import { initiateTopup, verifyTopup, getBalance, getTransactions } from "./wallet.controller.js";

const router = Router();

router.post("/topup/initiate", initiateTopup);
router.get("/balance",         getBalance);
router.get("/transactions",    getTransactions);
router.get("/topup/verify",    verifyTopup); // Khalti — no auth

export default router;