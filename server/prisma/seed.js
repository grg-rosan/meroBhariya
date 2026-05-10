import { prisma, pool } from "../src/config/db.config.js";
import bcrypt from "bcryptjs";
import "dotenv/config";

//_________data_________
const ZONES = [
  {
    name: "Valley",
    description: "Kathmandu Valley deliveries",
    surcharge: 0,
    multiplier: 1.0,
    sortOrder: 1,
    districts: [
      { name: "Kathmandu", province: "Bagmati" },
      { name: "Lalitpur", province: "Bagmati" },
      { name: "Bhaktapur", province: "Bagmati" },
      {name:"Makwanpur", province:"Bagmati"}
    ],
  },
  {
    name: "Highway",
    description: "Major highway corridors",
    surcharge: 50,
    multiplier: 1.1,
    sortOrder: 2,
    districts: [
      { name: "Parsa", province: "Madhesh" },
      { name: "Chitwan", province: "Bagmati" },
      { name: "Morang", province: "Koshi" },
    ],
  },
  {
    name: "Outstation",
    description: "Outside valley, major cities",
    surcharge: 100,
    multiplier: 1.2,
    sortOrder: 3,
    districts: [
      { name: "Kaski", province: "Gandaki" },
      { name: "Rupandehi", province: "Lumbini" },
    ],
  },
  {
    name: "Remote",
    description: "Remote and hill districts",
    surcharge: 250,
    multiplier: 1.5,
    sortOrder: 4,
    districts: [
      { name: "Humla", province: "Karnali" },
      { name: "Mugu", province: "Karnali" },
    ],
  },
];

const VEHICLES = [
  {
    name: "Bike",
    maxWeightKg: 20,
    fare: {
      baseFare: 50,
      perKmRate: 15,
      perKgRate: 5,
      minFare: 80,
      fragileCharge: 20,
      insuranceRate: 1.0,
      fuelSurcharge: 0,
      codChargeRate: 1.5,
      riderCutPct: 75.0,
    },
  },
  {
    name: "Mini Truck",
    maxWeightKg: 500,
    fare: {
      baseFare: 120,
      perKmRate: 20,
      perKgRate: 4,
      minFare: 150,
      fragileCharge: 30,
      insuranceRate: 1.5,
      fuelSurcharge: 0,
      codChargeRate: 1.5,
      riderCutPct: 70.0,
    },
  },
  {
    name: "Covered Van",
    maxWeightKg: 1500,
    fare: {
      baseFare: 200,
      perKmRate: 30,
      perKgRate: 2,
      minFare: 250,
      fragileCharge: 50,
      insuranceRate: 2.0,
      fuelSurcharge: 0,
      codChargeRate: 1.5,
      riderCutPct: 65.0,
    },
  },
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function findOrCreateUser({
  email,
  fullName,
  phoneNumber,
  role,
  password,
}) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      fullName,
      email,
      phoneNumber,
      role,
      passwordHash: await hashPassword(password),
      isActive: true,
      isEmailVerified: true, // staff accounts skip verification
    },
  });
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed...");

  // ── 1. Super Admin ────────────────────────────────────────
  await findOrCreateUser({
    fullName: "Super Admin",
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@merobhariya.com",
    password: process.env.SEED_ADMIN_PASSWORD ?? "Admin123!",
    phoneNumber: "9800000000",
    role: "ADMIN",
  });
  console.log("✅ Super Admin seeded.");

  // ── 2. Dispatcher ─────────────────────────────────────────
  await findOrCreateUser({
    fullName: "Test Dispatcher",
    email: process.env.SEED_DISPATCHER_EMAIL ?? "dispatcher@merobhariya.com",
    password: process.env.SEED_DISPATCHER_PASSWORD ?? "Dispatch123!",
    phoneNumber: "9800000001",
    role: "DISPATCHER",
  });
  console.log("✅ Dispatcher seeded.");

  // ── 3. Zones + Districts ──────────────────────────────────
  for (const zd of ZONES) {
    let zone = await prisma.zone.findFirst({ where: { name: zd.name } });
    if (!zone) {
      zone = await prisma.zone.create({
        data: {
          name: zd.name,
          description: zd.description,
          surcharge: zd.surcharge,
          multiplier: zd.multiplier,
          sortOrder: zd.sortOrder,
          isActive: true,
        },
      });
    } else {
      zone = await prisma.zone.update({
        where: { id: zone.id },
        data: {
          surcharge: zd.surcharge,
          multiplier: zd.multiplier,
          sortOrder: zd.sortOrder,
        },
      });
    }

    for (const d of zd.districts) {
      const exists = await prisma.district.findFirst({
        where: { name: d.name, zoneId: zone.id },
      });
      if (!exists) {
        await prisma.district.create({
          data: { name: d.name, province: d.province, zoneId: zone.id },
        });
      }
    }
  }
  console.log("✅ Zones and Districts seeded.");

  // ── 4. Vehicle Types + Fare Configs ──────────────────────
  for (const v of VEHICLES) {
    const vt = await prisma.vehicleType.upsert({
      where: { name: v.name },
      update: { maxWeightKg: v.maxWeightKg },
      create: { name: v.name, maxWeightKg: v.maxWeightKg, isActive: true },
    });
    await prisma.fareConfig.upsert({
      where: { vehicleTypeId: vt.id },
      update: { ...v.fare },
      create: { vehicleTypeId: vt.id, ...v.fare },
    });
  }
  console.log("✅ Vehicles and FareConfigs seeded.");

  // ── 5. Test Merchant (dev only) ───────────────────────────
  // Pre-verified so you can create shipments immediately in dev
  if (process.env.NODE_ENV !== "production") {
    const merchantUser = await findOrCreateUser({
      fullName: "Test Merchant",
      email: "merchant@merobhariya.com",
      password: "Merchant123!",
      phoneNumber: "9811111111",
      role: "MERCHANT",
    });

    // Kathmandu district for merchant pickup location
    const ktmDistrict = await prisma.district.findFirst({
      where: { name: "Kathmandu" },
    });

    let merchantProfile = await prisma.merchantProfile.findUnique({
      where: { userId: merchantUser.id },
    });
    if (!merchantProfile) {
      merchantProfile = await prisma.merchantProfile.create({
        data: {
          userId: merchantUser.id,
          businessName: "Test Business Pvt. Ltd.",
          panNumber: "123456789",
          pickupAddress: "New Road, Kathmandu",
          isVerified: true,
        },
      });
      await prisma.$executeRaw`UPDATE "MerchantProfile" SET location = ST_GeomFromEWKT('SRID=4326;POINT(85.3240 27.7172)') WHERE id = ${merchantProfile.id}`;

      // Seed approved merchant documents
      await prisma.merchantDocument.createMany({
        data: [
          {
            merchantId: merchantProfile.id,
            type: "PAN_CERTIFICATE",
            fileUrl: "https://placehold.co/seed",
            status: "APPROVED",
          },
          {
            merchantId: merchantProfile.id,
            type: "BUSINESS_REGISTRATION",
            fileUrl: "https://placehold.co/seed",
            status: "APPROVED",
          },
          {
            merchantId: merchantProfile.id,
            type: "OWNER_CITIZENSHIP",
            fileUrl: "https://placehold.co/seed",
            status: "APPROVED",
          },
          {
            merchantId: merchantProfile.id,
            type: "OWNER_PHOTO",
            fileUrl: "https://placehold.co/seed",
            status: "APPROVED",
          },
        ],
      });
    }
    console.log("✅ Test Merchant seeded (dev only).");

    // ── 6. Test Rider (dev only) ────────────────────────────
    const bikeType = await prisma.vehicleType.findUnique({
      where: { name: "Bike" },
    });

    const riderUser = await findOrCreateUser({
      fullName: "Test Rider",
      email: "rider@merobhariya.com",
      password: "Rider123!",
      phoneNumber: "9822222222",
      role: "RIDER",
    });

    let riderProfile = await prisma.riderProfile.findUnique({
      where: { userId: riderUser.id },
    });
    if (!riderProfile) {
      riderProfile = await prisma.riderProfile.create({
        data: {
          userId: riderUser.id,
          vehicleTypeId: bikeType.id,
          licenseNumber: "SEED-LIC-001",
          vehicleNumber: "BA 1 SEED 001",
          isVerified: true,
          isOnline: false,
        },
      });

      // Seed approved rider documents
      await prisma.riderDocument.createMany({
        data: [
          {
            riderId: riderProfile.id,
            type: "CITIZENSHIP_FRONT",
            fileUrl: "https://placehold.co/seed",
            status: "APPROVED",
          },
          {
            riderId: riderProfile.id,
            type: "CITIZENSHIP_BACK",
            fileUrl: "https://placehold.co/seed",
            status: "APPROVED",
          },
          {
            riderId: riderProfile.id,
            type: "DRIVING_LICENSE_FRONT",
            fileUrl: "https://placehold.co/seed",
            status: "APPROVED",
          },
          {
            riderId: riderProfile.id,
            type: "DRIVING_LICENSE_BACK",
            fileUrl: "https://placehold.co/seed",
            status: "APPROVED",
          },
          {
            riderId: riderProfile.id,
            type: "VEHICLE_BLUEBOOK",
            fileUrl: "https://placehold.co/seed",
            status: "APPROVED",
          },
          {
            riderId: riderProfile.id,
            type: "VEHICLE_INSURANCE",
            fileUrl: "https://placehold.co/seed",
            status: "APPROVED",
          },
          {
            riderId: riderProfile.id,
            type: "RIDER_PHOTO",
            fileUrl: "https://placehold.co/seed",
            status: "APPROVED",
          },
          {
            riderId: riderProfile.id,
            type: "VEHICLE_PHOTO",
            fileUrl: "https://placehold.co/seed",
            status: "APPROVED",
          },
        ],
      });

      // Rider wallet — required for earning transactions
      await prisma.riderWallet.create({
        data: { riderId: riderProfile.id, balance: 0, totalEarned: 0 },
      });
    }
    console.log("✅ Test Rider seeded (dev only).");
  }

  console.log("✨ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
