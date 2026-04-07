// src/modules/admin/verify/verify.controller.js
import * as verifyService from "./verify.services.js";

function handleError(res, err) {
  if (err.status && err.message) return res.status(err.status).json({ message: err.message });
  console.error("[Admin/Verify]", err);
  return res.status(500).json({ message: "Internal server error." });
}

// GET /api/admin/verify/merchants
export async function getPendingMerchantsHandler(req, res) {
  try {
    const { page, limit } = req.query;
    const data = await verifyService.getPendingMerchants({
      page:  parseInt(page)  || 1,
      limit: parseInt(limit) || 20,
    });
    return res.json(data);
  } catch (err) { return handleError(res, err); }
}

// GET /api/admin/verify/riders
export async function getPendingRidersHandler(req, res) {
  try {
    const { page, limit } = req.query;
    const data = await verifyService.getPendingRiders({
      page:  parseInt(page)  || 1,
      limit: parseInt(limit) || 20,
    });
    return res.json(data);
  } catch (err) { return handleError(res, err); }
}

// PATCH /api/admin/verify/merchant-doc/:docId
export async function reviewMerchantDocHandler(req, res) {
  try {
    const { docId }         = req.params;
    const { status, note }  = req.body;
    const updated = await verifyService.reviewMerchantDocument({
      docId, status, note, adminId: req.userId,
    });
    return res.json(updated);
  } catch (err) { return handleError(res, err); }
}

// PATCH /api/admin/verify/rider-doc/:docId
export async function reviewRiderDocHandler(req, res) {
  try {
    const { docId }                  = req.params;
    const { status, note, expiresAt } = req.body;
    const updated = await verifyService.reviewRiderDocument({
      docId, status, note, expiresAt, adminId: req.userId,
    });
    return res.json(updated);
  } catch (err) { return handleError(res, err); }
}

// GET /api/admin/verify/expired
export async function getExpiredDocsHandler(req, res) {
  try {
    const data = await verifyService.getExpiredDocuments();
    return res.json(data);
  } catch (err) { return handleError(res, err); }
}