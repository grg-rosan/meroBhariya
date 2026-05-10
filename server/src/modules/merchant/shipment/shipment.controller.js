// shipment/shipment.controller.js

import * as shipmentService from "./shipment.services.js";
import { catchAsync }       from "../../../utils/error/errorHandler.js";
import { parsePagination }  from "../../../utils/others/pagination.js";
import AppError             from "../../../utils/error/appError.js";
import { getAllDistricts }  from "../zone/zone.service.js";

// ── createShipment ────────────────────────────────────────────
// computeFare middleware already ran and attached ctx to req

export const createShipment = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;

  const ctx = {
    vehicleType:  req.vehicleType,
    distanceKm:   req.distanceKm,
    deliveryLat:  req.deliveryLat,
    deliveryLng:  req.deliveryLng,
    fare:         req.fare,       // full breakdown from computeFare
    zone:         req.zone,
    fromDistrict: req.fromDistrict,
    toDistrict:   req.toDistrict,
  };

  const shipment = await shipmentService.createShipment(merchantId, req.body, req.userId, ctx);
  return res.status(201).json({ success: true, data: shipment });
});

// ── getFarePreview ────────────────────────────────────────────
// computeFare middleware already ran — just return the values

export const getFarePreview = catchAsync(async (req, res) => {
  return res.json({
    success: true,
    data: {
      distanceKm:    parseFloat(req.distanceKm.toFixed(2)),
      zone:          req.zone.name,
      baseFare:      req.fare.baseFare,
      distanceFare:  req.fare.distanceFare,
      weightFare:    req.fare.weightFare,
      fragileCharge: req.fare.fragileCharge,
      zoneSurcharge: req.fare.zoneSurcharge,
      totalFare:     req.fare.totalFare,
      // insuranceFee intentionally excluded
    },
  });
});

// ── getDistricts ──────────────────────────────────────────────
// For shipment creation form dropdown

export const getDistricts = catchAsync(async (req, res) => {
  const districts = await getAllDistricts();
  return res.json({ success: true, data: districts });
});

// ── getMyShipments ────────────────────────────────────────────

export const getMyShipments = catchAsync(async (req, res) => {
  const merchantId            = req.merchantProfileId;
  const { page, limit, skip } = parsePagination(req.query);
  const { status }            = req.query;
  const result = await shipmentService.getMerchantShipments(merchantId, { page, limit, skip, status });
  return res.json({ success: true, ...result });
});

// ── getShipmentById ───────────────────────────────────────────

export const getShipmentById = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const shipment   = await shipmentService.getShipmentDetail(req.params.id, merchantId);
  return res.json({ success: true, data: shipment });
});

// ── cancelShipment ────────────────────────────────────────────

export const cancelShipment = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const shipment   = await shipmentService.cancelShipment(req.params.id, merchantId, req.userId);
  return res.json({ success: true, data: shipment });
});

// ── getCODLedger ──────────────────────────────────────────────

export const getCODLedger = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const result     = await shipmentService.getMerchantCODLedger(merchantId);
  return res.json({ success: true, data: result });
});

// ── bulkCreateShipments ───────────────────────────────────────

export const bulkCreateShipments = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded.", 400);
  const result = await shipmentService.bulkCreateShipments(
    req.merchantProfileId,
    req.file,
    req.userId,
  );
  return res.status(201).json({ success: true, data: result });
});