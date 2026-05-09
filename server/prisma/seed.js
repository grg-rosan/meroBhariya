import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Super Admin ───────────────────────────────────────────────────────────
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`[Seed] Super Admin already exists: ${email}`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.user.create({
      data: {
        fullName: "Super Admin",
        email,
        passwordHash,
        phoneNumber: "9800000000",
        role: "ADMIN",
        isActive: true,
        isEmailVerified: true,
      },
    });
    console.log(`[Seed] Super Admin created: ${admin.email}`);
  }

  // ── Plans ─────────────────────────────────────────────────────────────────
  const plans = [
    {
      name: "Starter",
      price: 0,
      shipmentQuota: 50,
      overageRate: null,
      isActive: true,
    },
    {
      name: "Growth",
      price: 999,
      shipmentQuota: 300,
      overageRate: 5,
      isActive: true,
    },
    {
      name: "Pro",
      price: 2499,
      shipmentQuota: null,
      overageRate: null,
      isActive: true,
    },
  ];

  for (const plan of plans) {
    const existingPlan = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (existingPlan) {
      console.log(`[Seed] Plan already exists: ${plan.name}`);
    } else {
      await prisma.plan.create({ data: plan });
      console.log(`[Seed] Plan seeded: ${plan.name}`);
    }
  }

  // ── Vehicle Types + Fare Configs ──────────────────────────────────────────
  const vehicles = [
    {
      name: "Bike",
      maxWeightKg: 20,
      description: "Motorcycle for small parcels",
      fare: {
        baseFare: 50,
        perKmRate: 15,
        perKgRate: 5,
        minFare: 80,
        fragileCharge: 20,
        riderCutPct: 75.0,
        isActive: true,
      },
    },
    {
      name: "Mini Truck",
      maxWeightKg: 500,
      description: "Mini truck for medium shipments",
      fare: {
        baseFare: 120,
        perKmRate: 20,
        perKgRate: 4,
        minFare: 150,
        fragileCharge: 30,
        riderCutPct: 75.0,
        isActive: true,
      },
    },
    {
      name: "Covered Van",
      maxWeightKg: 1500,
      description: "Covered van for large shipments",
      fare: {
        baseFare: 200,
        perKmRate: 30,
        perKgRate: 2,
        minFare: 250,
        fragileCharge: 50,
        riderCutPct: 75.0,
        isActive: true,
      },
    },
  ];

  for (const v of vehicles) {
    const vt = await prisma.vehicleType.upsert({
      where: { name: v.name },
      update: {
        maxWeightKg: v.maxWeightKg,
        description: v.description,
      },
      create: {
        name: v.name,
        maxWeightKg: v.maxWeightKg,
        description: v.description,
      },
    });

    await prisma.fareConfig.upsert({
      where: { vehicleTypeId: vt.id },
      update: {
        baseFare: v.fare.baseFare,
        perKmRate: v.fare.perKmRate,
        perKgRate: v.fare.perKgRate,
        minFare: v.fare.minFare,
        fragileCharge: v.fare.fragileCharge,
        riderCutPct: v.fare.riderCutPct,
        isActive: v.fare.isActive,
      },
      create: { vehicleTypeId: vt.id, ...v.fare },
    });

    console.log(`[Seed] Vehicle + FareConfig seeded: ${v.name}`);
  }
}

main()
  .catch((e) => {
    console.error("[Seed] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());