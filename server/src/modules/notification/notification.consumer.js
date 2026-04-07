// src/modules/notifications/notification.consumer.js
// Consumes merchant + rider notification queues.
// Each message carries an `event` field — the Socket.IO event name to emit.
// Each user is in their personal room: "user:<userId>"

import { getChannel } from "../../config/rabbitmq.js";
import { QUEUE }      from "../../config/queues.js";

let io = null;

export async function startNotificationConsumers(socketIO) {
  io = socketIO;
  await consumeMerchantNotifications();
  await consumeRiderNotifications();
  console.log("[NotificationConsumer] Both consumers started");
}

// ─── Merchant queue ───────────────────────────────────────────────────────────

async function consumeMerchantNotifications() {
  const ch = getChannel();

  await ch.consume(
    QUEUE.MERCHANT_NOTIFICATIONS,
    (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        // payload.merchantUserId is the User.id (not MerchantProfile.id)
        emitToUser(payload.merchantUserId, payload.event, payload);
        ch.ack(msg);
      } catch (err) {
        console.error("[NotificationConsumer/Merchant]", err.message);
        ch.nack(msg, false, false);
      }
    },
    { noAck: false },
  );
}

// ─── Rider queue ──────────────────────────────────────────────────────────────

async function consumeRiderNotifications() {
  const ch = getChannel();

  await ch.consume(
    QUEUE.RIDER_NOTIFICATIONS,
    (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        // payload.riderUserId is the User.id (not RiderProfile.id)
        emitToUser(payload.riderUserId, payload.event, payload);
        ch.ack(msg);
      } catch (err) {
        console.error("[NotificationConsumer/Rider]", err.message);
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
  console.log(`[NotificationConsumer] Emitted "${event}" → room ${room}`);
}