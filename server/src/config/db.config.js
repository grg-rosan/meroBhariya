import { PrismaClient } from "@prisma/client";
import pkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import logger from "../utils/logger.js";

// ── Self-contained client (seed doesn't need the app's pool) ──
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info("DB connected via Prisma");
  } catch (error) {
    logger.error({ err: error }, "DB connection error");
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
};

export { prisma, pool, connectDB, disconnectDB };
