import { createClient } from "redis";
import logger from "../utils/logger.js";

let client;

export async function getRedisClient() {
  if (client?.isOpen) return client;

  client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (err) => logger.error({ err }, "[Redis]"));
  client.on("connect", () => logger.info("[Redis] Connected to Redis Cloud"));

  await client.connect();
  return client;
}
