// src/modules/admin/finance/finance.controller.js
import * as financeService from "./finance.services.js";

function handleError(res, err) {
  if (err.status && err.message) return res.status(err.status).json({ message: err.message });
  console.error("[Admin/Finance]", err);
  return res.status(500).json({ message: "Internal server error." });
}

// GET /api/admin/finance/revenue?from=&to=
export async function getRevenueSummaryHandler(req, res) {
  try {
    const { from, to } = req.query;
    return res.json(await financeService.getRevenueSummary({ from, to }));
  } catch (err) { return handleError(res, err); }
}

// GET /api/admin/finance/cod/pending?page=&limit=
export async function getPendingCODHandler(req, res) {
  try {
    const { page, limit } = req.query;
    return res.json(await financeService.getPendingCOD({
      page:  parseInt(page)  || 1,
      limit: parseInt(limit) || 20,
    }));
  } catch (err) { return handleError(res, err); }
}

// PATCH /api/admin/finance/cod/:transactionId/settle
export async function settleCODHandler(req, res) {
  try {
    const { transactionId }  = req.params;
    const { collectedByRider } = req.body;
    return res.json(await financeService.settleCOD(transactionId, {
      collectedByRider, adminId: req.userId,
    }));
  } catch (err) { return handleError(res, err); }
}

// POST /api/admin/finance/cod/settle-rider/:riderId
export async function settleAllCODForRiderHandler(req, res) {
  try {
    const { riderId } = req.params;
    return res.json(await financeService.settleAllCODForRider(riderId));
  } catch (err) { return handleError(res, err); }
}

// GET /api/admin/finance/transactions?paymentType=&isRemitted=&from=&to=&page=&limit=
export async function getTransactionsHandler(req, res) {
  try {
    const { page, limit, paymentType, isRemitted, from, to } = req.query;
    return res.json(await financeService.getTransactions({
      page:        parseInt(page)  || 1,
      limit:       parseInt(limit) || 20,
      paymentType,
      isRemitted,
      from,
      to,
    }));
  } catch (err) { return handleError(res, err); }
}