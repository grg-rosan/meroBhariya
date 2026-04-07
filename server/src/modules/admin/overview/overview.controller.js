// src/modules/admin/overview/overview.controller.js
import * as overviewService from "./overview.services.js";

function handleError(res, err) {
  if (err.status && err.message) return res.status(err.status).json({ message: err.message });
  console.error("[Admin/Overview]", err);
  return res.status(500).json({ message: "Internal server error." });
}

// GET /api/admin/overview/stats
export async function getStatsHandler(req, res) {
  try {
    const data = await overviewService.getPlatformStats();
    return res.json(data);
  } catch (err) { return handleError(res, err); }
}

// GET /api/admin/overview/health
export async function getHealthHandler(req, res) {
  try {
    const data = await overviewService.getPlatformHealth();
    return res.json(data);
  } catch (err) { return handleError(res, err); }
}

// GET /api/admin/overview/quick-actions
export async function getQuickActionCountsHandler(req, res) {
  try {
    const data = await overviewService.getQuickActionCounts();
    return res.json(data);
  } catch (err) { return handleError(res, err); }
}

// GET /api/admin/overview/activity
export async function getRecentActivityHandler(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const data  = await overviewService.getRecentActivity(limit);
    return res.json(data);
  } catch (err) { return handleError(res, err); }
}