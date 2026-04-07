// src/modules/dispatcher/dispatcher.consumer.js
// Consumes shipment.created events from RabbitMQ.
// Broadcasts to all connected dispatcher UIs via Socket.IO.
// prefetch(1) in rabbitmq.js ensures only ONE instance processes each message
// even when multiple dispatchers / server instances are running.

import { getChannel } from "../../config/rabbitmq.js";
import { QUEUE }      from "../../config/queues.js";
import { prisma }     from "../../config/prisma.js";

let io = null;

export async function startDispatcherConsumer(socketIO) {
  io = socketIO;
  const ch = getChannel();

  await ch.consume(
    QUEUE.DISPATCHER_NEW_SHIPMENTS,
    async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        await handleNewShipment(payload);
        ch.ack(msg);
      } catch (err) {
        console.error("[DispatcherConsumer] Error:", err.message);
        // nack + no requeue → goes to dead-letter queue
        ch.nack(msg, false, false);
      }
    },
    { noAck: false },
  );

  console.log("[DispatcherConsumer] Listening on:", QUEUE.DISPATCHER_NEW_SHIPMENTS);
}

async function handleNewShipment(payload) {
  const { shipmentId } = payload;

  // Fetch full shipment so the dispatcher board gets complete data
  const shipment = await prisma.shipment.findUnique({
    where:   { id: shipmentId },
    include: {
      merchant:    { select: { businessName: true, pickupAddress: true } },
      vehicleType: { select: { name: true } },
    },
  });

  if (!shipment) {
    throw new Error(`Shipment ${shipmentId} not found`);
  }

  if (!io) return;

  // Broadcast to every dispatcher currently connected
  // Each dispatcher joins the "dispatchers" room on socket connect (see app.js)
  io.to("dispatchers").emit("shipment:new", {
    shipmentId:      shipment.id,
    trackingNumber:  shipment.trackingNumber,
    merchantName:    shipment.merchant.businessName,
    pickupAddress:   shipment.merchant.pickupAddress,
    deliveryAddress: shipment.deliveryAddress,
    vehicleType:     shipment.vehicleType.name,
    weight:          shipment.weight,
    isFragile:       shipment.isFragile,
    codAmount:       shipment.codAmount,
    fareSnapshot:    shipment.fareSnapshot,
    createdAt:       shipment.createdAt,
  });

  console.log(`[DispatcherConsumer] Emitted shipment:new → dispatchers room (${shipmentId})`);
}