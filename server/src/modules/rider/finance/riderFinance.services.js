import { prisma }           from "../../../config/db.config.js";
import AppError              from "../../../utils/error/appError.js";
import { parsePagination }   from "../../../utils/others/pagination.js";
import { buildDateFilter }   from "../../../utils/others/dateFilter.js";
import { findProfile }       from "../rider.services.js";

// ── Date boundary helpers ──────────────────────────────────────
function startOf(unit) {
  const d = new Date();
  if (unit === "day")   { d.setHours(0, 0, 0, 0); return d; }
  if (unit === "week")  { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d; }
  if (unit === "month") { d.setDate(1); d.setHours(0, 0, 0, 0); return d; }
}

// ─────────────────────────────────────────────────────────────────
// GET /earnings
// ─────────────────────────────────────────────────────────────────
export const getRiderEarnings = async (userId, query) => {
  const profile               = await findProfile(userId);
  const { page, limit, skip } = parsePagination(query);
 const { from, to, page: _page, limit: _limit } = query;
const dateFilter = buildDateFilter(from, to);

  const deliveryWhere = {
    riderId: profile.id,
    status:  "DELIVERED",
    ...(dateFilter ? { updatedAt: dateFilter } : {}),
  };

  // Resolve wallet first — needed for walletId-scoped aggregates below
  const wallet = await prisma.riderWallet.findUnique({
    where:  { riderId: profile.id },
    select: { id: true, balance: true, totalEarned: true },
  });

  const [total, deliveries, weekEarnings, monthEarnings, payouts, todayBreakdown] =
    await Promise.all([
      // 1. total delivered count (for pagination header + totalDrops stat)
      prisma.shipment.count({ where: deliveryWhere }),

      // 2. paginated delivery list
      prisma.shipment.findMany({
        where:   deliveryWhere,
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
          // FIX: schema relation is singular — riderTransaction, not riderTransactions
          riderTransaction: {
            select: { amount: true, note: true },
          },
        },
      }),

      // 3. this-week earning sum — use walletId directly (safe even if wallet is null)
      wallet
        ? prisma.riderTransaction.aggregate({
            where: {
              walletId:  wallet.id,
              type:      "DELIVERY_EARNING",
              createdAt: { gte: startOf("week") },
            },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: 0 } }),

      // 4. this-month earning sum
      wallet
        ? prisma.riderTransaction.aggregate({
            where: {
              walletId:  wallet.id,
              type:      "DELIVERY_EARNING",
              createdAt: { gte: startOf("month") },
            },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: 0 } }),

      // 5. payout history (last 10)
      //    FIX: status values match PayoutStatus enum — PENDING | PROCESSING | COMPLETED | FAILED
      prisma.riderPayout.findMany({
        where:   { riderId: profile.id },
        orderBy: { requestedAt: "desc" },
        take:    10,
        select: {
          id:          true,
          amount:      true,
          method:      true,
          status:      true,   // PENDING | PROCESSING | COMPLETED | FAILED
          requestedAt: true,
          processedAt: true,
        },
      }),

      // 6. today's transactions for the breakdown panel
      wallet
        ? prisma.riderTransaction.findMany({
            where: {
              walletId:  wallet.id,
              createdAt: { gte: startOf("day") },
            },
            orderBy: { createdAt: "asc" },
            select: { type: true, amount: true, note: true },
          })
        : Promise.resolve([]),
    ]);

  // ── Shape breakdown rows
  //    FIX: PENALTY does not exist in RiderTxType — use DEDUCTION and ADJUSTMENT
  const NEGATIVE_TYPES = new Set(["DEDUCTION", "ADJUSTMENT"]);
  const breakdown = todayBreakdown.map((t) => ({
    label:  t.note ?? t.type,
    amount: NEGATIVE_TYPES.has(t.type)
      ? -Math.abs(Number(t.amount))
      :  Number(t.amount),
  }));

  return {
    // wallet summary
    walletBalance: Number(wallet?.balance    ?? 0),
    totalEarned:   Number(wallet?.totalEarned ?? 0),
    week:          Number(weekEarnings._sum.amount  ?? 0),
    month:         Number(monthEarnings._sum.amount ?? 0),

    // panels
    payouts: payouts.map((p) => ({
      id:     p.id,
      date:   new Date(p.requestedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      amount: Number(p.amount),
      method: p.method,
      status: p.status,   // PENDING | PROCESSING | COMPLETED | FAILED
      processedAt: p.processedAt,
    })),
    breakdown,

    // paginated delivery list
    total,
    page,
    limit,
    // FIX: strip singular riderTransaction, re-expose as flat fields
    data: deliveries.map((s) => ({
      trackingNumber:  s.trackingNumber,
      receiverName:    s.receiverName,
      deliveryAddress: s.deliveryAddress,
      fareSnapshot:    s.fareSnapshot,
      codAmount:       s.codAmount,
      updatedAt:       s.updatedAt,
      transaction:     s.transaction,
      riderEarning:    s.riderTransaction?.amount ?? null,
      earningNote:     s.riderTransaction?.note   ?? null,
    })),
  };
};

// ─────────────────────────────────────────────────────────────────

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

  if (!amount || amount < 100)
    throw new AppError("Minimum payout amount is NPR 100.", 400);

  const validMethods = ["ESEWA", "KHALTI", "BANK", "CASH"];
  if (!validMethods.includes(method))
    throw new AppError(`Invalid payout method. Must be one of: ${validMethods.join(", ")}`, 400);

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
  if (Number(wallet.balance) < amount)
    throw new AppError(
      `Insufficient balance. Available: NPR ${wallet.balance}, Requested: NPR ${amount}.`,
      400
    );
  if (pendingPayout)
    throw new AppError(
      "You already have a pending payout request. Please wait for it to be processed.",
      400
    );

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