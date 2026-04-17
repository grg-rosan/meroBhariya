// src/modules/admin/verify/verify.service.js
import { prisma } from "../../../config/db.config.js";
import { sendNotification,NOTIFICATION_TYPE } from "../../../utils/services/sendNotification.js";
import { publish } from "../../../infrastructure/rabbitmq/publisher.js";
//await sendNotification({ type: NOTIFICATION_TYPE.DOC_APPROVED, user, payload: { docType: doc.type } });

// ─── List pending merchants ───────────────────────────────────────────────────

export async function getPendingMerchants({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  // Merchants who have at least one PENDING document
  const [merchants, total] = await Promise.all([
    prisma.merchantProfile.findMany({
      skip,
      take: limit,
      where: {
        documents: { some: { status: "PENDING" } },
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phoneNumber: true,
            createdAt: true,
          },
        },
        documents: {
          select: {
            id: true,
            type: true,
            fileUrl: true,
            status: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: { documents: { _count: "desc" } },
    }),
    prisma.merchantProfile.count({
      where: { documents: { some: { status: "PENDING" } } },
    }),
  ]);

  return { merchants, total, page, limit };
}

// ─── List pending riders ──────────────────────────────────────────────────────

export async function getPendingRiders({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [riders, total] = await Promise.all([
    prisma.riderProfile.findMany({
      skip,
      take: limit,
      where: {
        documents: { some: { status: "PENDING" } },
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phoneNumber: true,
            createdAt: true,
          },
        },
        vehicleType: { select: { name: true } },
        documents: {
          select: {
            id: true,
            type: true,
            fileUrl: true,
            status: true,
            expiresAt: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: { documents: { _count: "desc" } },
    }),
    prisma.riderProfile.count({
      where: { documents: { some: { status: "PENDING" } } },
    }),
  ]);

  return { riders, total, page, limit };
}

// ─── Review a single merchant document ───────────────────────────────────────

export async function reviewMerchantDocument({ docId, status, note, adminId }) {
  if (!["APPROVED", "REJECTED"].includes(status)) {
    throw { status: 400, message: "Status must be APPROVED or REJECTED." };
  }

  const doc = await prisma.merchantDocument.findUnique({
    where: { id: docId },
  });
  if (!doc) throw { status: 404, message: "Document not found." };

  const updated = await prisma.merchantDocument.update({
    where: { id: docId },
    data: { status, note: note ?? null, reviewedAt: new Date() },
  });
  const merchant = await prisma.merchantProfile.findUnique({
    where: { id: doc.merchantId },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, phoneNumber: true },
      },
    },
  });

  await sendNotification({
    type:
      status === "APPROVED"
        ? NOTIFICATION_TYPE.DOC_APPROVED
        : NOTIFICATION_TYPE.DOC_REJECTED,
    user: merchant.user,
    payload: { docType: doc.type, note: note ?? null },
  });

  publish("notification.merchant.doc", {
    merchantUserId: merchant.user.id,
    event:
      status === "APPROVED" ? "merchant:doc_approved" : "merchant:doc_rejected",
    docType: doc.type,
    note: note ?? null,
  });
  // If all docs for this merchant are approved → no-op (admin manually activates)
  // If any doc rejected → optionally notify (handled by notification util)
  return updated;
}

// ─── Review a single rider document ──────────────────────────────────────────

export async function reviewRiderDocument({
  docId,
  status,
  note,
  expiresAt,
  adminId,
}) {
  if (!["APPROVED", "REJECTED"].includes(status)) {
    throw { status: 400, message: "Status must be APPROVED or REJECTED." };
  }

  const doc = await prisma.riderDocument.findUnique({
    where: { id: docId },
    include: { rider: true },
  });
  if (!doc) throw { status: 404, message: "Document not found." };

  const updated = await prisma.riderDocument.update({
    where: { id: docId },
    data: {
      status,
      note: note ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : doc.expiresAt,
      reviewedAt: new Date(),
    },
  });

  const rider = await prisma.riderProfile.findUnique({
    where: { id: doc.riderId },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, phoneNumber: true },
      },
    },
  });

  await sendNotification({
    type:
      status === "APPROVED"
        ? NOTIFICATION_TYPE.DOC_APPROVED
        : NOTIFICATION_TYPE.DOC_REJECTED,
    user: rider.user,
    payload: { docType: doc.type, note: note ?? null },
  });

  publish("notification.rider.doc", {
    riderUserId: rider.user.id,
    event: status === "APPROVED" ? "rider:doc_approved" : "rider:doc_rejected",
    docType: doc.type,
    note: note ?? null,
  });

  // Auto-verify rider when ALL their documents are approved
  await maybeVerifyRider(doc.riderId);

  return updated;
}

async function maybeVerifyRider(riderId) {
  const docs = await prisma.riderDocument.findMany({ where: { riderId } });

  // Required doc types that must all be APPROVED
  const REQUIRED_TYPES = [
    "CITIZENSHIP_FRONT",
    "CITIZENSHIP_BACK",
    "DRIVING_LICENSE_FRONT",
    "VEHICLE_BLUEBOOK",
    "RIDER_PHOTO",
  ];

  const approvedTypes = docs
    .filter((d) => d.status === "APPROVED")
    .map((d) => d.type);

  const allApproved = REQUIRED_TYPES.every((t) => approvedTypes.includes(t));

  if (allApproved) {
    await prisma.riderProfile.update({
      where: { id: riderId },
      data: { isVerified: true },
    });
  }

  const rider = await prisma.riderProfile.findUnique({
    where: { id: riderId },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, phoneNumber: true },
      },
    },
  });

  await sendNotification({
    type: NOTIFICATION_TYPE.RIDER_VERIFIED,
    user: rider.user,
    payload: {},
  });

  publish("notification.rider.doc", {
    riderUserId: rider.user.id,
    event: "rider:verified",
  });
}

// ─── Get expired documents ────────────────────────────────────────────────────

export async function getExpiredDocuments() {
  const expired = await prisma.riderDocument.findMany({
    where: {
      status: "APPROVED",
      expiresAt: { lt: new Date() },
    },
    include: {
      rider: {
        include: {
          user: { select: { fullName: true, email: true, phoneNumber: true } },
        },
      },
    },
    orderBy: { expiresAt: "asc" },
  });

  // Mark rider as unverified if docs are expired
  const expiredRiderIds = [...new Set(expired.map((d) => d.riderId))];
  if (expiredRiderIds.length) {
    await prisma.riderProfile.updateMany({
      where: { id: { in: expiredRiderIds } },
      data: { isVerified: false },
    });
  }

  return expired;
}
