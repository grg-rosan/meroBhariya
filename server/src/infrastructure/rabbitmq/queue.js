import { getChannel } from "./connection.js";
import logger from "../../utils/logger.js";

export const EXCHANGE = "porter.shipments";

export const QUEUE = {
  DISPATCHER_ASSIGNMENTS: "dispatcher.assignments",
  MERCHANT_NOTIFICATIONS: "merchant.notifications",
  RIDER_NOTIFICATIONS: "rider.notifications",
  DELIVERY_EVENTS: "delivery.events",
};

export async function assertQueues() {
  const ch = getChannel();
  if (!ch) {
    logger.warn("[RabbitMQ] Skipping queue assertion - no channel");
    return;
  }

  await ch.assertExchange(EXCHANGE, "topic", { durable: true });

  await ch.assertQueue(QUEUE.DISPATCHER_ASSIGNMENTS, { durable: true });
  await ch.bindQueue(QUEUE.DISPATCHER_ASSIGNMENTS, EXCHANGE, "shipment.new");

  await ch.assertQueue(QUEUE.MERCHANT_NOTIFICATIONS, { durable: true });
  await ch.bindQueue(
    QUEUE.MERCHANT_NOTIFICATIONS,
    EXCHANGE,
    "notification.merchant.#",
  );

  await ch.assertQueue(QUEUE.RIDER_NOTIFICATIONS, { durable: true });
  await ch.bindQueue(
    QUEUE.RIDER_NOTIFICATIONS,
    EXCHANGE,
    "notification.rider.#",
  );
  await ch.assertQueue(QUEUE.DELIVERY_EVENTS, { durable: true });
  await ch.bindQueue(QUEUE.DELIVERY_EVENTS, EXCHANGE, "shipment.delivered");

  logger.info("[RabbitMQ] Queues asserted");
}
