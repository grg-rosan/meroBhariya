import { getChannel } from "../connection.js";
import { QUEUE } from "../queue.js";
import { getIO } from "../../socket/socket.handler.js";

export async function startDispatcherConsumer() {
  const ch = getChannel();
  if (!ch) return console.warn("[Consumer] No channel - skipping dispatcher consumer");

  await ch.consume(QUEUE.DISPATCHER_ASSIGNMENTS, (msg) => {
    if (!msg) return;
    try {
      const shipment = JSON.parse(msg.content.toString());
      console.log("[Dispatcher] New shipment to assign:", shipment.trackingNumber);

      // Push to dispatcher dashboard in real time
      const io = getIO();
      if (io) {
        io.to("dispatchers").emit("shipment:new", shipment);
      }

      ch.ack(msg);
    } catch (err) {
      console.error("[Dispatcher Consumer] Failed to process message:", err.message);
      ch.nack(msg, false, false);
    }
  });

  console.log("[Consumer] Dispatcher consumer started");
}