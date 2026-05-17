import { getChannel } from "../connection.js";
import { QUEUE } from "../queue.js";
import { getIO } from "../../socket/socket.handler.js";
import logger from "../../logger/index.js";
export async function startDispatcherConsumer() {
  const ch = getChannel();
  if (!ch)
    return logger.warn("[Consumer] No channel - skipping dispatcher consumer");

  await ch.consume(QUEUE.DISPATCHER_ASSIGNMENTS, (msg) => {
    if (!msg) return;
    try {
      const shipment = JSON.parse(msg.content.toString());
      logger.info(
        { trackingNumber: shipment.trackingNumber },
        "[Dispatcher] New shipment to assign",
      );

      // Push to dispatcher dashboard in real time
      const io = getIO();
      if (io) {
        io.to("dispatchers").emit("shipment:new", shipment);
      }

      ch.ack(msg);
    } catch (err) {
      logger.error({ err }, "[Dispatcher Consumer] Failed to process message");
      ch.nack(msg, false, false);
    }
  });

  logger.info("[Consumer] Dispatcher consumer started");
}
