
import { publish } from "../../../infrastructure/rabbitmq/publisher.js";

export function publishShipmentNew(shipment, vehicleType, paymentType) {
  publish("shipment.new", {
    shipmentId: shipment.id,
    trackingNumber: shipment.trackingNumber,
    merchantId: shipment.merchantId,
    vehicleTypeId: shipment.vehicleTypeId,
    vehicleTypeName: vehicleType.name,
    deliveryAddress: shipment.deliveryAddress,
    weight: shipment.weight,
    isFragile: shipment.isFragile,
    codAmount: shipment.codAmount,
    fareSnapshot: shipment.fareSnapshot,
    paymentType,
    createdAt: shipment.createdAt,
  });
}

export function publishShipmentCancelled(shipment) {
  publish("shipment.cancelled", {
    shipmentId: shipment.id,
    trackingNumber: shipment.trackingNumber,
    merchantId: shipment.merchantId,
    reason: "Cancelled by merchant",
  });
}