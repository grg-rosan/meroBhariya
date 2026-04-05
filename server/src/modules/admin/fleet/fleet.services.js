// src/modules/admin/fleet/fleet.service.js
import { prisma } from "../../../config/prisma.js";

// ─── Vehicle Types ─────────────────────────────────────────────────────────────

export async function getAllVehicleTypes() {
  return prisma.vehicleType.findMany({
    include: {
      fareConfig: true,
      _count: {
        select: { riders: true, shipments: true },
      },
    },
    orderBy: { id: "asc" },
  });
}

export async function createVehicleType({ name, maxWeightKg, description }) {
  const exists = await prisma.vehicleType.findUnique({ where: { name } });
  if (exists) throw { status: 409, message: `Vehicle type "${name}" already exists.` };

  return prisma.vehicleType.create({
    data: { name, maxWeightKg, description },
  });
}

export async function toggleVehicleTypeStatus(vehicleTypeId) {
  const vt = await prisma.vehicleType.findUnique({ where: { id: vehicleTypeId } });
  if (!vt) throw { status: 404, message: "Vehicle type not found." };

  return prisma.vehicleType.update({
    where: { id: vehicleTypeId },
    data:  { isActive: !vt.isActive },
  });
}

// ─── Fare Config ───────────────────────────────────────────────────────────────

export async function getFareConfig(vehicleTypeId) {
  const config = await prisma.fareConfig.findUnique({
    where:   { vehicleTypeId },
    include: { vehicleType: { select: { name: true } } },
  });
  if (!config) throw { status: 404, message: "Fare config not found for this vehicle type." };
  return config;
}

export async function upsertFareConfig(vehicleTypeId, data) {
  const vt = await prisma.vehicleType.findUnique({ where: { id: vehicleTypeId } });
  if (!vt) throw { status: 404, message: "Vehicle type not found." };

  const {
    baseFare, perKmRate, perKgRate, minFare,
    fragileCharge, codChargeRate, nightSurcharge, cancelCharge,
  } = data;

  return prisma.fareConfig.upsert({
    where:  { vehicleTypeId },
    create: {
      vehicleTypeId,
      baseFare, perKmRate, perKgRate, minFare,
      fragileCharge:  fragileCharge  ?? 0,
      codChargeRate:  codChargeRate  ?? 0,
      nightSurcharge: nightSurcharge ?? 0,
      cancelCharge:   cancelCharge   ?? 0,
    },
    update: {
      baseFare, perKmRate, perKgRate, minFare,
      fragileCharge:  fragileCharge  ?? 0,
      codChargeRate:  codChargeRate  ?? 0,
      nightSurcharge: nightSurcharge ?? 0,
      cancelCharge:   cancelCharge   ?? 0,
      isActive: true,
    },
  });
}

export async function getAllFareConfigs() {
  return prisma.fareConfig.findMany({
    include: { vehicleType: { select: { name: true, maxWeightKg: true } } },
    orderBy: { vehicleTypeId: "asc" },
  });
}