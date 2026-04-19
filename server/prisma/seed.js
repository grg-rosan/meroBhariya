
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
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD 

  console.log(email, password)

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[Seed] Super Admin already exists: ${email}`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.user.create({
      data: {
        fullName:    "Super Admin",
        email,
        passwordHash,
        phoneNumber: "9800000000",
        role:        "ADMIN",
        isActive:    true,
      },
    });
    console.log(`[Seed] Super Admin created: ${admin.email}`);
  }

  // ── Vehicle Types + Fare Configs ──────────────────────────────────────────
  const vehicles = [
    {
      name: "Bike", maxWeightKg: 20, description: "Motorcycle for small parcels",
      fare: { baseFare: 50, perKmRate: 15, perKgRate: 5, minFare: 80, fragileCharge: 20, codChargeRate: 0.02, nightSurcharge: 30, cancelCharge: 25 },
    },
    {
      name: "Mini Truck", maxWeightKg: 500, description: "Mini truck for medium shipments",
      fare: { baseFare: 120, perKmRate: 20, perKgRate: 4, minFare: 150, fragileCharge: 20, codChargeRate: 0.02, nightSurcharge: 30, cancelCharge: 25 },
    },
    {
      name: "Covered Van", maxWeightKg: 1500, description: "Covered van for large shipments",
      fare: { baseFare: 200, perKmRate: 30, perKgRate: 2, minFare: 250, fragileCharge: 50, codChargeRate: 0.02, nightSurcharge: 50, cancelCharge: 50 },
    },
  ];

  for (const v of vehicles) {
    const vt = await prisma.vehicleType.upsert({
      where:  { name: v.name },
      update: {},
      create: { name: v.name, maxWeightKg: v.maxWeightKg, description: v.description },
    });

    await prisma.fareConfig.upsert({
      where:  { vehicleTypeId: vt.id },
      update: {},
      create: { vehicleTypeId: vt.id, ...v.fare },
    });

    console.log(`[Seed] Vehicle type seeded: ${v.name}`);
  }
}

main()
  .catch((e) => {
    console.error("[Seed] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
