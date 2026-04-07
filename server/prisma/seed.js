// prisma/seed.js
// Run once: npx prisma db seed
// This creates the first Super Admin account.
// After this, all other admins/dispatchers are created via the Admin Dashboard.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@merobhariya.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@1234";

  // Check if super admin already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[Seed] Super Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      fullName:     "Super Admin",
      email,
      passwordHash,
      phoneNumber:  "9800000000",
      role:         "ADMIN",
      isActive:     true,
    },
  });

  console.log(`[Seed] Super Admin created:`);
  console.log(`       Email:    ${admin.email}`);
  console.log(`       Password: ${password}`);
  console.log(`       ⚠ Change this password immediately after first login.`);
}

main()
  .catch((e) => {
    console.error("[Seed] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());