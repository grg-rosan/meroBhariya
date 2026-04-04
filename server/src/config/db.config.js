import dotenv from "dotenv"
dotenv.config({ override: false })
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL 
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: [{ emit: "event", level: "query" }],
})

prisma.$on("query", (e) => {
  console.log("Query:", e.query)
  console.log("Params:", e.params)
  console.log("Duration:", e.duration + "ms")
})

const connectDB = async () => {
  try {
    await prisma.$connect()
    console.log("DB connected via Prisma")
  } catch (error) {
    console.error(`DB connection error: ${error.message}`)
  }
}

const disconnectDB = async () => {
  await prisma.$disconnect()
}

export { prisma, connectDB, disconnectDB }