// shipment/shipment.events.js
// Publishes shipment events to RabbitMQ
// insuranceFee intentionally excluded from all events

import { publish } from "../../../infrastructure/rabbitmq/publisher.js";

export function publishShipmentNew(shipment, vehicleType, paymentType) {
  publish("shipment.new", {
    shipmentId:      shipment.id,
    trackingNumber:  shipment.trackingNumber,
    merchantId:      shipment.merchantId,
vehicleTypeName: vehicleType?.name ?? "Unknown",
    vehicleTypeName: vehicleType.name,
    deliveryAddress: shipment.deliveryAddress,
    deliveryLat:     shipment.deliveryLat,
    deliveryLng:     shipment.deliveryLng,
    fromDistrictId:  shipment.fromDistrictId,
    toDistrictId:    shipment.toDistrictId,
    zoneId:          shipment.zoneId,
    weight:          shipment.weight,
    isFragile:       shipment.isFragile,
    codAmount:       shipment.codAmount,
    totalFare:       shipment.totalFare,  // insuranceFee not exposed
    paymentType,
    createdAt:       shipment.createdAt,
  });
}

export function publishShipmentCancelled(shipment) {
  publish("shipment.cancelled", {
    shipmentId:     shipment.id,
    trackingNumber: shipment.trackingNumber,
    merchantId:     shipment.merchantId,
    reason:         "Cancelled by merchant",
  });
}