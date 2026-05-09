import { prisma }      from "../../../config/db.config.js";
import AppError        from "../../../utils/error/appError.js";
import { parsePagination } from "../../../utils/others/pagination.js";
import { buildDateFilter } from "../../../utils/others/dateFilter.js";
import { findProfile } from "../rider.services.js";


export const getRiderEarnings = async (userId, query) => {
  const profile              = await findProfile(userId);
  const { page, limit, skip } = parsePagination(query);
  const dateFilter           = buildDateFilter(query);

  const where = {
    riderId: profile.id,
    status:  "DELIVERED",
    ...(dateFilter ? { updatedAt: dateFilter } : {}),
  };

  const [total, data, wallet] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      select: {
        trackingNumber:  true,
        receiverName:    true,
        deliveryAddress: true,
        fareSnapshot:    true,
        codAmount:       true,
        updatedAt:       true,
        transaction: {
          select: {
            collectedByRider: true,
            isRemitted:       true,
            remittedAt:       true,
          },
        },
        // Actual earning amount for this shipment
        riderTransactions: {
          where:  { type: "DELIVERY_EARNING" },
          select: { amount: true, note: true },
          take:   1,
        },
      },
    }),
    prisma.riderWallet.findUnique({
      where:  { riderId: profile.id },
      select: { balance: true, totalEarned: true },
    }),
  ]);

  return {
    total,
    page,
    limit,
    walletBalance: Number(wallet?.balance   ?? 0),
    totalEarned:   Number(wallet?.totalEarned ?? 0),
    data: data.map((s) => ({
      ...s,
      riderEarning: s.riderTransactions?.[0]?.amount ?? null,
      earningNote:  s.riderTransactions?.[0]?.note   ?? null,
      riderTransactions: undefined, // strip raw field
    })),
  };
};

export const getRiderWallet = async (userId) => {
  const profile = await findProfile(userId);

  const wallet = await prisma.riderWallet.findUnique({
    where:   { riderId: profile.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take:    20,
        select: {
          id:         true,
          type:       true,
          amount:     true,
          note:       true,
          createdAt:  true,
          shipmentId: true,
        },
      },
    },
  });

  if (!wallet) throw new AppError("Wallet not found.", 404);
  return wallet;
};

export const requestPayout = async (userId, { amount, method }) => {
  const profile = await findProfile(userId);

  if (!amount || amount < 100) {
    throw new AppError("Minimum payout amount is NPR 100.", 400);
  }

  const validMethods = ["ESEWA", "KHALTI", "BANK", "CASH"];
  if (!validMethods.includes(method)) {
    throw new AppError(`Invalid payout method. Must be one of: ${validMethods.join(", ")}`, 400);
  }

  const [wallet, pendingPayout] = await Promise.all([
    prisma.riderWallet.findUnique({
      where:  { riderId: profile.id },
      select: { id: true, balance: true },
    }),
    prisma.riderPayout.findFirst({
      where: { riderId: profile.id, status: { in: ["PENDING", "PROCESSING"] } },
    }),
  ]);

  if (!wallet) throw new AppError("Wallet not found.", 404);
  if (Number(wallet.balance) < amount) {
    throw new AppError(
      `Insufficient balance. Available: NPR ${wallet.balance}, Requested: NPR ${amount}.`,
      400
    );
  }
  if (pendingPayout) {
    throw new AppError(
      "You already have a pending payout request. Please wait for it to be processed.",
      400
    );
  }

  // Balance NOT deducted here — admin approves → then deducted
  return prisma.riderPayout.create({
    data: { riderId: profile.id, amount, method, status: "PENDING" },
  });
};


export const getRiderPayouts = async (userId) => {
  const profile = await findProfile(userId);

  return prisma.riderPayout.findMany({
    where:   { riderId: profile.id },
    orderBy: { requestedAt: "desc" },
    select: {
      id:          true,
      amount:      true,
      method:      true,
      status:      true,
      requestedAt: true,
      processedAt: true,
    },
  });
};