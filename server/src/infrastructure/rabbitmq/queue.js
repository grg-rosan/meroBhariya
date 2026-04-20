import { getChannel } from "./connection.js";

export const EXCHANGE = "porter.shipments";

export const QUEUE = {
  DISPATCHER_ASSIGNMENTS: "dispatcher.assignments",
  MERCHANT_NOTIFICATIONS: "merchant.notifications",
  RIDER_NOTIFICATIONS:    "rider.notifications",
};

export async function assertQueues() {
  const ch = getChannel();
  if (!ch) {
    console.warn("[RabbitMQ] Skipping queue assertion - no channel");
    return;
  }

  await ch.assertExchange(EXCHANGE, "topic", { durable: true });

  await ch.assertQueue(QUEUE.DISPATCHER_ASSIGNMENTS, { durable: true });
  await ch.bindQueue(QUEUE.DISPATCHER_ASSIGNMENTS, EXCHANGE, "shipment.new");

  await ch.assertQueue(QUEUE.MERCHANT_NOTIFICATIONS, { durable: true });
  await ch.bindQueue(QUEUE.MERCHANT_NOTIFICATIONS, EXCHANGE, "notification.merchant.#");

  await ch.assertQueue(QUEUE.RIDER_NOTIFICATIONS, { durable: true });
  await ch.bindQueue(QUEUE.RIDER_NOTIFICATIONS, EXCHANGE, "notification.rider.#");

  console.log("[RabbitMQ] Queues asserted");
}
