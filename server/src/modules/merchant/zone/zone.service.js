// zone/zone.service.js
// Resolves zone from district
// Harder zone (higher surcharge) always wins

import { prisma } from "../../config/db.config.js";
import AppError   from "../../utils/error/appError.js";

/**
 * Get district by id
 */
export async function getDistrictById(districtId) {
  const district = await prisma.district.findUnique({
    where:   { id: Number(districtId) },
    include: { zone: true },
  });
  if (!district) throw new AppError(`District not found: ${districtId}`, 404);
  return district;
}

/**
 * Get district by name (case-insensitive)
 */
export async function getDistrictByName(name) {
  const district = await prisma.district.findFirst({
    where:   { name: { equals: name, mode: "insensitive" } },
    include: { zone: true },
  });
  if (!district) throw new AppError(`District not found: ${name}`, 404);
  return district;
}

/**
 * Resolve applicable zone between two districts
 * Higher surcharge zone wins (harder delivery = more expensive)
 */
export async function resolveZone(fromDistrictId, toDistrictId) {
  const [from, to] = await Promise.all([
    getDistrictById(fromDistrictId),
    getDistrictById(toDistrictId),
  ]);

  // Higher surcharge zone is the applicable one
  const zone = Number(from.zone.surcharge) >= Number(to.zone.surcharge)
    ? from.zone
    : to.zone;

  return { fromDistrict: from, toDistrict: to, zone };
}

/**
 * Get all zones (for admin / seed reference)
 */
export async function getAllZones() {
  return prisma.zone.findMany({
    where:   { isActive: true },
    include: { districts: true },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Get all districts (for shipment form dropdown)
 */
export async function getAllDistricts() {
  return prisma.district.findMany({
    include: { zone: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
}