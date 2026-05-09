import { prisma } from "../../../../config/db.config.js";
import AppError from "../../../../utils/error/appError.js";
import * as khaltiClient from "./khalti.client.js";

export async function initiateShipmentPayment(shipmentId, merchantId) {
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, merchantId },
    include: { khaltiPayment: true }
  });

  if (!shipment) throw new AppError("Shipment not found.", 404);
  
  // Prevent double payment
  if (shipment.khaltiPayment?.status === "COMPLETED") {
    throw new AppError("This shipment has already been paid for.", 400);
  }

  const amount = Number(shipment.totalFare);

  const response = await khaltiClient.requestKhaltiInitiate({
    return_url: `${process.env.FRONTEND_URL}/payment/verify`,
    amount: Math.round(amount * 100), // Paisa
    purchase_order_id: shipment.id,
    purchase_order_name: `Shipment ${shipment.trackingNumber}`,
    // ... rest of payload
  });

  await prisma.khaltiPayment.upsert({
    where: { shipmentId },
    update: { pidx: response.pidx, status: "INITIATED" },
    create: {
      merchantId,
      shipmentId,
      amount,
      pidx: response.pidx,
      status: "INITIATED",
    },
  });

  return { paymentUrl: response.payment_url };
}
export async function verifyShipmentPayment(pidx, shipmentId, merchantId) {
  const response = await khaltiClient.requestKhaltiLookup(pidx);

  if (response.status === "Completed") {
    return await prisma.$transaction(async (tx) => {
      // 1. Mark Payment as Completed
      await tx.khaltiPayment.update({
        where: { pidx },
        data: {
          status: "COMPLETED",
          txnId: response.transaction_id,
          completedAt: new Date(),
        },
      });

      // 2. Update Shipment - Move from "Draft/Pending" to "Ready"
      // This is the trigger for your Dispatchers/Riders to see the order
      await tx.shipment.update({
        where: { id: shipmentId },
        data: { 
          status: "PENDING", // If PENDING means "Ready for Pickup" in your flow
          // OR use a boolean flag like 'isPaid: true' if you add it to schema
        }
      });

      // 3. Create the Transaction record for accounting
      await tx.transaction.create({
        data: {
          shipmentId,
          paymentType: "PREPAID",
          totalFare: Number(response.total_amount) / 100,
        },
      });

      // 4. Log the event
      await tx.shipmentLog.create({
        data: {
          shipmentId,
          status: "PENDING",
          note: "Payment Successful. Shipment activated for pickup.",
          updatedById: merchantId, // Usually the user ID associated with the merchant
        }
      });

      return { success: true };
    });
  }
  // ... handle failure
}