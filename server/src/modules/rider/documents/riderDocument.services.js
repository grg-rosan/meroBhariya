import { prisma } from "../../../config/db.config.js";
import { findProfile } from "../rider.services.js";

export const getRiderDocuments = async (userId) => {
  const profile = await findProfile(userId);
  return prisma.riderDocument.findMany({
    where: { riderId: profile.id },
    orderBy: { uploadedAt: "desc" },
  });
};

export const upsertRiderDocument = async (userId, { type, fileUrl, filePublicId, expiresAt }) => {
  const profile = await findProfile(userId);

  const existing = await prisma.riderDocument.findFirst({
    where: { riderId: profile.id, type },
    select: { id: true },
  });

  const payload = {
    fileUrl,
    filePublicId: filePublicId ?? null,
    status: "PENDING",
    uploadedAt: new Date(),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  };

  if (existing) {
    return prisma.riderDocument.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return prisma.riderDocument.create({
    data: { riderId: profile.id, type, ...payload },
  });
};

export const getRiderDocumentByType = async (userId, type) => {
  const profile = await findProfile(userId); // Re-using findProfile helper
  return prisma.riderDocument.findFirst({
    where: { riderId: profile.id, type },
    select: { id: true, filePublicId: true },
  });
};