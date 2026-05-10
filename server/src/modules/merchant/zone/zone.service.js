// zone/zone.service.js
// Resolves zone from district
// Harder zone (higher surcharge) always wins — destination zone wins on tie

import { prisma } from "../../../config/db.config.js";
import AppError from "../../../utils/error/appError.js";
export async function getDistrictById(districtId) {
  const district = await prisma.district.findUnique({
    where:   { id: Number(districtId) },
    include: { zone: true },
  });
  if (!district) throw new AppError(`District not found: ${districtId}`, 404);
  return district;
}

export async function getDistrictByName(name) {
  const district = await prisma.district.findFirst({
    where:   { name: { equals: name, mode: "insensitive" } },
    include: { zone: true },
  });
  if (!district) throw new AppError(`District not found: ${name}`, 404);
  return district;
}

/**
 * Resolve applicable zone between two districts.
 * Higher surcharge zone wins — destination zone wins on tie.
 * Rationale: delivery difficulty is determined by where you're going, not where you're from.
 */
export async function resolveZone(fromDistrictId, toDistrictId) {
  const [from, to] = await Promise.all([
    getDistrictById(fromDistrictId),
    getDistrictById(toDistrictId),
  ]);

  const zone = Number(to.zone.surcharge) >= Number(from.zone.surcharge)
    ? to.zone
    : from.zone;

  return { fromDistrict: from, toDistrict: to, zone };
}

export async function getAllZones() {
  return prisma.zone.findMany({
    where:   { isActive: true },
    include: { districts: true },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * For shipment creation form dropdown.
 * Only shows districts belonging to active zones.
 */
export async function getAllDistricts() {
  return prisma.district.findMany({
    where:   { zone: { isActive: true } },
    include: { zone: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
}