import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting Seeding...");

  // 1. Super Admin
  const email = process.env.SEED_ADMIN_EMAIL || "admin@logistics.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin123!";

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      fullName: "Super Admin",
      email,
      passwordHash,
      phoneNumber: "9800000000",
      role: "ADMIN",
      isActive: true,
      isEmailVerified: true,
    },
  });
  console.log("✅ Super Admin seeded.");

  // 2. Zones & Districts (Crucial for Shipment logic)
  const zoneData = [
    { name: "Valley", surcharge: 0, multiplier: 1.0, districts: ["Kathmandu", "Lalitpur", "Bhaktapur"] },
    { name: "Highway", surcharge: 50, multiplier: 1.1, districts: ["Parsa", "Chitwan", "Morang"] },
    { name: "Outstation", surcharge: 100, multiplier: 1.2, districts: ["Kaski", "Rupandehi"] },
    { name: "Remote", surcharge: 250, multiplier: 1.5, districts: ["Humla", "Mugu"] },
  ];

  for (const z of zoneData) {
    const zone = await prisma.zone.upsert({
      where: { id: zoneData.indexOf(z) + 1 }, // Using index as ID for stable seeding
      update: { surcharge: z.surcharge, multiplier: z.multiplier },
      create: {
        name: z.name,
        surcharge: z.surcharge,
        multiplier: z.multiplier,
        isActive: true,
      },
    });

    for (const dName of z.districts) {
      await prisma.district.upsert({
        where: { id: (zone.id * 100) + z.districts.indexOf(dName) }, // Unique ID logic
        update: {},
        create: {
          name: dName,
          province: "State 1", // Placeholder
          zoneId: zone.id,
        },
      });
    }
  }
  console.log("✅ Zones and Districts seeded.");

  // 3. Vehicle Types + Fare Configs
  const vehicles = [
    {
      name: "Bike",
      maxWeightKg: 20,
      fare: { baseFare: 50, perKmRate: 15, perKgRate: 5, minFare: 80, fragileCharge: 20, insuranceRate: 1.0, riderCutPct: 75.0 },
    },
    {
      name: "Mini Truck",
      maxWeightKg: 500,
      fare: { baseFare: 120, perKmRate: 20, perKgRate: 4, minFare: 150, fragileCharge: 30, insuranceRate: 1.5, riderCutPct: 70.0 },
    },
    {
      name: "Covered Van",
      maxWeightKg: 1500,
      fare: { baseFare: 200, perKmRate: 30, perKgRate: 2, minFare: 250, fragileCharge: 50, insuranceRate: 2.0, riderCutPct: 65.0 },
    },
  ];

  for (const v of vehicles) {
    const vt = await prisma.vehicleType.upsert({
      where: { name: v.name },
      update: { maxWeightKg: v.maxWeightKg },
      create: {
        name: v.name,
        maxWeightKg: v.maxWeightKg,
        isActive: true,
      },
    });

    await prisma.fareConfig.upsert({
      where: { vehicleTypeId: vt.id },
      update: { ...v.fare },
      create: { vehicleTypeId: vt.id, ...v.fare },
    });
  }
  console.log("✅ Vehicles and FareConfigs seeded.");

  console.log("✨ Seeding Completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });