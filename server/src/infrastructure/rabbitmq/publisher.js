import { getChannel } from "./connection.js";
import { EXCHANGE } from "./queue.js";

export function publish(routingKey, payload) {
  const ch = getChannel();
  if (!ch) {
    console.warn("[Publisher] RabbitMQ unavailable — skipping:", routingKey);
    return;
  }
  ch.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
  console.log("[Publisher]", routingKey, payload);
}

// ─── Shipment created → dispatcher board ─────────────────────────────────────

export const publishNewShipment = (payload) =>
  publish("shipment.new", payload);

// ─── Rider notification → rider's socket room ─────────────────────────────────
// Caller must include riderUserId (User.id, not RiderProfile.id)

export const publishRiderNotification = (payload) =>
  publish("notification.rider.assigned", {
    ...payload,
    riderUserId: payload.riderUserId,
    event:       "shipment:assigned",
  });

// ─── Merchant notification → merchant's socket room ──────────────────────────
// Caller must include merchantUserId (User.id, not MerchantProfile.id)
// Pass a custom `event` in payload to override the default

export const publishMerchantNotification = (payload) =>
  publish("notification.merchant.update", {
    ...payload,
    merchantUserId: payload.merchantUserId,
    event:          payload.event ?? "shipment:status_updated",
  });