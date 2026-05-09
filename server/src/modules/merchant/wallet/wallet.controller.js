// src/modules/merchant/wallet/wallet.controller.js

import { catchAsync } from "../../../utils/error/errorHandler.js";
import * as walletService from "./wallet.services.js";

// ─── POST /api/merchant/payments/topup/initiate ───────────────────────────────

export const initiateTopup = catchAsync(async (req, res) => {
  const result = await walletService.initiateTopup({
    merchantId: req.merchantProfileId,
    amount:     req.body.amount,
    user:       req.user,
  });
  res.status(200).json(result);
});

// ─── GET /api/merchant/payments/topup/verify (Khalti redirects here) ─────────

export const verifyTopup = catchAsync(async (req, res) => {
  const { pidx, status } = req.query;
  try {
    const result = await walletService.verifyTopup(pidx, status);
    res.redirect(
      `${process.env.FRONTEND_URL}/merchant/payments?topup=success&amount=${result.amount}`
    );
  } catch (err) {
    console.error("Topup verify error:", err.message);
    const reason = err.statusCode === 409 ? "duplicate" : "failed";
    res.redirect(`${process.env.FRONTEND_URL}/merchant/payments?topup=${reason}`);
  }
});

// ─── GET /api/merchant/payments/balance ──────────────────────────────────────

export const getBalance = catchAsync(async (req, res) => {
  const result = await walletService.getWalletBalance(req.merchantProfileId);
  res.status(200).json(result);
});

// ─── GET /api/merchant/payments/transactions ──────────────────────────────────

export const getTransactions = catchAsync(async (req, res) => {
  const result = await walletService.getWalletTransactions(req.merchantProfileId);
  res.status(200).json(result);
});