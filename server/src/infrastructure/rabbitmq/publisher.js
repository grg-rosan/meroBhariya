import { getChannel } from "./connection.js";
import { EXCHANGE }   from "./queue.js";

/**
 * Publish a message to the porter.shipments topic exchange.
 *
 * @param {string} routingKey  - e.g. "shipment.new" | "notification.rider.doc" | "notification.merchant.delivered"
 * @param {object} payload     - any serializable object
 */
export function publish(routingKey, payload) {
  const ch = getChannel();
  ch.publish(
    EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true },
  );
  console.log(`[Publisher] ${routingKey}`, payload);
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export const publishNewShipment = (payload) =>
  publish("shipment.new", payload);

export const publishRiderNotification = (payload) =>
  publish("notification.rider.assigned", payload);

export const publishMerchantNotification = (payload) =>
  publish("notification.merchant.update", payload);
