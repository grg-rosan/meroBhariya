import { catchAsync } from "../../../utils/error/errorHandler.js";
import AppError       from "../../../utils/error/appError.js";
import * as codService from "./riderCOD.services.js";


export const getCODSummary = catchAsync(async (req, res) => {
  const data = await codService.getRiderCODSummary(req.userId);
  res.status(200).json({ success: true, data });
});


export const remitCOD = catchAsync(async (req, res) => {
  const { shipmentIds } = req.body;
  if (!shipmentIds) throw new AppError("shipmentIds is required.", 400);
  const data = await codService.remitCODToDispatcher(req.userId, shipmentIds);
  res.status(200).json({ success: true, data });
});