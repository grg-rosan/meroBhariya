
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
      name: "Scooter", maxWeightKg: 15, description: "Scooter for light deliveries",
      fare: { baseFare: 60, perKmRate: 18, perKgRate: 6, minFare: 90, fragileCharge: 20, codChargeRate: 0.02, nightSurcharge: 30, cancelCharge: 25 },
    },
    {
      name: "Van", maxWeightKg: 200, description: "Van for large shipments",
      fare: { baseFare: 150, perKmRate: 25, perKgRate: 3, minFare: 200, fragileCharge: 50, codChargeRate: 0.02, nightSurcharge: 50, cancelCharge: 50 },
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