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

export const publishNewShipment = (payload) => publish("shipment.new", payload);
export const publishRiderNotification = (payload) => publish("notification.rider.assigned", payload);
export const publishMerchantNotification = (payload) => publish("notification.merchant.update", payload);
