// server/src/controllers/wallet.controller.js

import { v4 as uuid } from "uuid";
import prisma from "../lib/prisma.js";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../services/khalti.service.js";
import { sendTopupConfirmationEmail } from "../services/mail.service.js";

// POST /api/merchant/wallet/topup/initiate
export const initiateTopup = async (req, res) => {
  const { amount } = req.body;
  const merchantId = req.user.merchantId;

  if (!amount || amount < 100) {
    return res.status(400).json({ error: "Minimum top-up is NPR 100" });
  }

  try {
    const orderId = `TOPUP-${merchantId}-${uuid()}`;

    const khaltiRes = await initiateKhaltiPayment({
      amount,
      orderId,
      orderName: "meroBhariya Wallet Top-up",
      returnUrl: `${process.env.BACKEND_URL}/api/merchant/wallet/topup/verify`,
      customerInfo: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      },
    });

    // save pidx to DB before redirecting
    await prisma.pendingTopup.create({
      data: {
        pidx: khaltiRes.pidx,
        merchantId,
        amount,
        purchaseOrderId: orderId,
      },
    });

    res.json({
      payment_url: khaltiRes.payment_url,
      pidx: khaltiRes.pidx,
    });

  } catch (err) {
    console.error("Khalti initiate error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
};

// GET /api/merchant/wallet/topup/verify  (Khalti redirects here)
export const verifyTopup = async (req, res) => {
  const { pidx, status } = req.query;

  if (status !== "Completed") {
    return res.redirect(
      `${process.env.FRONTEND_URL}/wallet?topup=failed`
    );
  }

  try {
    // 1. verify with Khalti — never trust redirect params alone
    const khaltiRes = await verifyKhaltiPayment(pidx);

    if (khaltiRes.status !== "Completed") {
      return res.redirect(
        `${process.env.FRONTEND_URL}/wallet?topup=failed`
      );
    }

    // 2. find pending record
    const pending = await prisma.pendingTopup.findUnique({
      where: { pidx },
    });

    if (!pending) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/wallet?topup=invalid`
      );
    }

    // 3. idempotency guard — don't double credit
    if (pending.status === "COMPLETED") {
      return res.redirect(
        `${process.env.FRONTEND_URL}/wallet?topup=duplicate`
      );
    }

    // 4. atomic DB write — wallet credit + transaction record
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { merchantId: pending.merchantId },
      });

      await tx.wallet.update({
        where: { merchantId: pending.merchantId },
        data: { balance: { increment: pending.amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "TOPUP",
          amount: pending.amount,
          note: `Khalti top-up · txn ${khaltiRes.transaction_id}`,
        },
      });

      await tx.pendingTopup.update({
        where: { pidx },
        data: { status: "COMPLETED" },
      });
    });

    // 5. send confirmation email
    await sendTopupConfirmationEmail(pending.merchantId, pending.amount);

    res.redirect(
      `${process.env.FRONTEND_URL}/wallet?topup=success&amount=${pending.amount}`
    );

  } catch (err) {
    console.error("Khalti verify error:", err.response?.data || err.message);
    res.redirect(`${process.env.FRONTEND_URL}/wallet?topup=error`);
  }
};