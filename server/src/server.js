import http from "http";
import { execSync } from "child_process";
import { Server as socketIOServer } from "socket.io";
import app from "./app.js";
import { disconnectDB } from "./config/db.config.js";
import { initSocketHandlers } from "./infrastructure/socket/socket.handler.js";
import { assertQueues } from "./infrastructure/rabbitmq/queue.js";
import { connectRabbitMQ } from "./infrastructure/rabbitmq/connection.js";
import { startNotificationConsumers } from "./modules/notification/notification.consumer.js";
import { getRedisClient } from "./config/redis.config.js";
import { startDeliveryConsumer } from "./infrastructure/rabbitmq/consumers/delivery.consumer.js";
import logger from "./infrastructure/logger/index.js";
const port = process.env.PORT || 3000;

// Auto-migrate on startup with retry logic
const runMigrations = (retries = 5, delayMs = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      logger.info(`Running database migrations (attempt ${i + 1}/${retries})...`);
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
      logger.info("Migrations complete.");
      return;
    } catch (err) {
      if (i < retries - 1) {
        logger.warn(`Migration failed, retrying in ${delayMs}ms...`);
        execSync(`sleep ${delayMs / 1000}`);
      } else {
        logger.warn({ err }, "Migration warning — all retries exhausted, continuing startup");
      }
    }
  }
};

runMigrations();

const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "https://mero-bhariya.vercel.app",
  "https://merobhariya.me",
  "https://www.merobhariya.me",
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new socketIOServer(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

initSocketHandlers(io);

await connectRabbitMQ();
await assertQueues();
await startNotificationConsumers(io);
await startDeliveryConsumer();
await getRedisClient();

server.listen(port, () => {
  logger.info({ port }, "listening to port");
});

const shutdown = async (code, reason) => {
  logger.info({ reason }, "Shutting down");
  server.close(async () => {
    io.close();
    await disconnectDB();
    process.exit(code);
  });
  setTimeout(() => process.exit(code), 10_000).unref();
};

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "Unhandled Rejection");
  shutdown(1, "unhandledRejection");
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception");
  shutdown(1, "uncaughtException");
});
process.on("SIGTERM", () => shutdown(0, "SIGTERM"));
process.on("SIGINT", () => shutdown(0, "SIGINT"));

export { server, io };