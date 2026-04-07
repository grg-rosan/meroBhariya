// src/modules/admin/settlements/settlements.controller.js
import * as settlementsService from "./settlements.services.js";

function handleError(res, err) {
  if (err.status && err.message) return res.status(err.status).json({ message: err.message });
  console.error("[Admin/Settlements]", err);
  return res.status(500).json({ message: "Internal server error." });
}

// GET /api/admin/settlements/riders?page=&limit=
export async function getRiderSettlementSummaryHandler(req, res) {
  try {
    const { page, limit } = req.query;
    return res.json(await settlementsService.getRiderSettlementSummary({
      page:  parseInt(page)  || 1,
      limit: parseInt(limit) || 20,
    }));
  } catch (err) { return handleError(res, err); }
}

// GET /api/admin/settlements/riders/:riderId
export async function getRiderSettlementDetailHandler(req, res) {
  try {
    return res.json(await settlementsService.getRiderSettlementDetail(req.params.riderId));
  } catch (err) { return handleError(res, err); }
}

// GET /api/admin/settlements/shipment/:shipmentId/logs
export async function getShipmentLogsHandler(req, res) {
  try {
    return res.json(await settlementsService.getShipmentLogs(req.params.shipmentId));
  } catch (err) { return handleError(res, err); }
}