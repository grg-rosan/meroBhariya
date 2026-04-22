import { getChannel } from "../connection.js";
import { QUEUE } from "../queue.js";
import { settleDelivery } from "../../../modules/admin/finance/finance.services.js";
export async function startDeliveryConsumer() {
  const ch = getChannel();
  if (!ch) return console.warn("[Consumer] No channel - skipping delivery consumer");

  await ch.consume(QUEUE.DELIVERY_EVENTS, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      console.log("[Consumer] shipment.delivered:", payload.trackingNumber);
      await settleDelivery(payload);
      ch.ack(msg);
    } catch (err) {
      console.error("[Consumer] Settlement failed:", err.message);
      ch.nack(msg, false, false); // dead-letter, don't requeue
    }
  });

  console.log("[Consumer] Delivery consumer started");
}