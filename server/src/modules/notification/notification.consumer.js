// src/modules/notifications/notification.consumer.js
// Consumes merchant + rider notification queues.
// Each message carries an `event` field — the Socket.IO event name to emit.
// Each user is in their personal room: "user:<userId>"

import { getChannel } from "../../infrastructure/rabbitmq/connection.js";
import { QUEUE } from "../../infrastructure/rabbitmq/queue.js";
import logger from "../../utils/logger.js";
let io = null;

export async function startNotificationConsumers(socketIO) {
  io = socketIO;
  await consumeMerchantNotifications();
  await consumeRiderNotifications();
  logger.info("[NotificationConsumer] Both consumers started");
}

// ─── Merchant queue ───────────────────────────────────────────────────────────

async function consumeMerchantNotifications() {
  const ch = getChannel();
  if (!ch) {
    logger.warn("[RabbitMQ] Cannot start consumer: Channel is null.");
    return;
  }

  await ch.consume(
    QUEUE.MERCHANT_NOTIFICATIONS,
    (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        emitToUser(payload.merchantUserId, payload.event, payload);
        ch.ack(msg);
      } catch (err) {
        logger.error({ err }, "[NotificationConsumer/Merchant]");
        ch.nack(msg, false, false);
      }
    },
    { noAck: false },
  );
}

// ─── Rider queue ──────────────────────────────────────────────────────────────

async function consumeRiderNotifications() {
  const ch = getChannel();
  if (!ch) {
    logger.warn("[RabbitMQ] Cannot start consumer: Channel is null.");
    return;
  }
  await ch.consume(
    QUEUE.RIDER_NOTIFICATIONS,
    (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        emitToUser(payload.riderUserId, payload.event, payload);
        ch.ack(msg);
      } catch (err) {
        logger.error({ err }, "[NotificationConsumer/Rider]");
        ch.nack(msg, false, false);
      }
    },
    { noAck: false },
  );
}

// ─── Emit to a specific user's socket room ────────────────────────────────────

function emitToUser(userId, event, payload) {
  if (!io || !userId || !event) return;

  const room = `user:${userId}`;
  io.to(room).emit(event, payload);
  logger.info({ event, room }, "[NotificationConsumer] Emitted");
}
