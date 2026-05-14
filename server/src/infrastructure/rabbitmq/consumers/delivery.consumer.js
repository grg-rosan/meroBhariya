import { getChannel } from "../connection.js";
import { QUEUE } from "../queue.js";
import { settleDelivery } from "../../../modules/admin/finance/finance.services.js";
import logger from "../../../utils/logger.js";

export async function startDeliveryConsumer() {
  const ch = getChannel();
  if (!ch)
    return logger.warn("[Consumer] No channel - skipping delivery consumer");

  await ch.consume(QUEUE.DELIVERY_EVENTS, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      logger.info(
        { trackingNumber: payload.trackingNumber },
        "[Consumer] shipment.delivered",
      );
      await settleDelivery(payload);
      ch.ack(msg);
    } catch (err) {
      logger.error({ err }, "[Consumer] Settlement failed");
      ch.nack(msg, false, false);
    }
  });

  logger.info("[Consumer] Delivery consumer started");
}
