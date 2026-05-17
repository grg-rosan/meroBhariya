import { createClient } from "redis";
import logger from "../infrastructure/logger/index.js";
let client;

export async function getRedisClient() {
  if (client?.isOpen) return client;

  client = createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: process.env.NODE_ENV === "production",   // TLS only in prod
      rejectUnauthorized: false
    }
  });

  client.on("error", (err) => logger.error({ err }, "[Redis]"));
  client.on("connect", () => logger.info("[Redis] Connected to Redis Cloud"));

  await client.connect();
  return client;
}