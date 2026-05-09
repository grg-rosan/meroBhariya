import { catchAsync } from "../../../utils/error/errorHandler.js";
import AppError       from "../../../utils/error/appError.js";
import * as financeService from "./riderFinance.services.js";


export const getEarnings = catchAsync(async (req, res) => {
  const data = await financeService.getRiderEarnings(req.userId, req.query);
  res.status(200).json({ success: true, ...data });
});


export const getWallet = catchAsync(async (req, res) => {
  const data = await financeService.getRiderWallet(req.userId);
  res.status(200).json({ success: true, data });
});


export const requestPayout = catchAsync(async (req, res) => {
  const { amount, method } = req.body;
  if (!amount || !method) throw new AppError("amount and method are required.", 400);
  const data = await financeService.requestPayout(req.userId, { amount, method });
  res.status(201).json({ success: true, data });
});


export const getPayouts = catchAsync(async (req, res) => {
  const data = await financeService.getRiderPayouts(req.userId);
  res.status(200).json({ success: true, data });
});