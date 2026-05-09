// src/modules/merchant/wallet/wallet.service.js

import { v4 as uuid }  from "uuid";
import { prisma }      from "../../../config/db.config.js";
import { transporter } from "../../../config/email.config.js";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../../../utils/services/khalti.services.js";
import AppError        from "../../../utils/error/appError.js";

// ── Safe wallet fetch — creates row if missing ────────────────────────────────
async function getOrCreateWallet(merchantId) {
  const existing = await prisma.merchantWallet.findUnique({ where: { merchantId } });
  if (existing) return existing;
  try {
    return await prisma.merchantWallet.create({ data: { merchantId, balance: 0 } });
  } catch (e) {
    if (e.code === "P2002") {
      return prisma.merchantWallet.findUnique({ where: { merchantId } });
    }
    throw e;
  }
}

// ── Load full user from merchant profile ──────────────────────────────────────
// requireAuth only sets req.user = { id, role } — not fullName/email/phone.
// We fetch the full record here so customerInfo is always populated.
async function getUserByMerchantId(merchantId) {
  return prisma.user.findFirst({
    where:  { merchantProfile: { id: merchantId } },
    select: { fullName: true, email: true, phoneNumber: true },
  });
}

// ─── Initiate Topup ───────────────────────────────────────────────────────────
// Removed `user` param — we load it ourselves from the DB

export async function initiateTopup({ merchantId, amount }) {
  if (!amount || amount < 100)
    throw new AppError("Minimum top-up is NPR 100.", 400);

  const user    = await getUserByMerchantId(merchantId);
  const orderId = `TOPUP-${merchantId}-${uuid()}`;

  const khaltiRes = await initiateKhaltiPayment({
    amount,
    orderId,
    orderName:    "meroBhariya Wallet Top-up",
    returnUrl:    `${process.env.BACKEND_URL}/api/merchant/payments/topup/verify`,
    customerInfo: {
      name:  user?.fullName    ?? "",
      email: user?.email       ?? "",
      phone: user?.phoneNumber ?? "",
    },
  });

  await prisma.pendingTopup.create({
    data: { pidx: khaltiRes.pidx, merchantId, amount, purchaseOrderId: orderId },
  });

  return { payment_url: khaltiRes.payment_url, pidx: khaltiRes.pidx };
}

// ─── Verify Topup ─────────────────────────────────────────────────────────────

export async function verifyTopup(pidx, status) {
  if (status !== "Completed")
    throw new AppError("Payment was not completed.", 400);

  const khaltiRes = await verifyKhaltiPayment(pidx);
  if (khaltiRes.status !== "Completed")
    throw new AppError("Khalti verification failed.", 400);

  const pending = await prisma.pendingTopup.findUnique({ where: { pidx } });
  if (!pending) throw new AppError("Pending topup not found.", 404);
  if (pending.status === "COMPLETED")
    throw new AppError("Top-up already processed.", 409);

  await prisma.$transaction(async (tx) => {
    const wallet = await getOrCreateWallet(pending.merchantId);

    await tx.merchantWallet.update({
      where: { merchantId: pending.merchantId },
      data:  { balance: { increment: pending.amount } },
    });

    await tx.merchantTransaction.create({
      data: {
        walletId: wallet.id,
        type:     "TOPUP",
        amount:   pending.amount,
        note:     `Khalti top-up · txn ${khaltiRes.transaction_id}`,
      },
    });

    await tx.pendingTopup.update({
      where: { pidx },
      data:  { status: "COMPLETED" },
    });
  });

  const user = await getUserByMerchantId(pending.merchantId);
  if (user?.email) {
    await transporter.sendMail({
      from:    `"meroBhariya" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: "Wallet Top-up Successful",
      html:    `<h2>Hi ${user.fullName},</h2><p>Your wallet has been topped up.</p><ul><li><strong>Amount:</strong> NPR ${pending.amount}</li><li><strong>Transaction ID:</strong> ${khaltiRes.transaction_id}</li></ul>`,
    });
  }

  return { amount: pending.amount };
}

// ─── Get Wallet Balance ───────────────────────────────────────────────────────

export async function getWalletBalance(merchantId) {
  const wallet = await getOrCreateWallet(merchantId);
  return { balance: Number(wallet.balance) };
}

// ─── Get Wallet Transactions ──────────────────────────────────────────────────

export async function getWalletTransactions(merchantId) {
  const wallet = await getOrCreateWallet(merchantId);

  const transactions = await prisma.merchantTransaction.findMany({
    where:   { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    select:  { id: true, type: true, amount: true, note: true, createdAt: true },
  });

  return { transactions };
}