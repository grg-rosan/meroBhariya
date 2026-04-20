import http from "http"
import { execSync } from "child_process"
import { Server as socketIOServer} from "socket.io"
import app from "./app.js";
import { disconnectDB } from "./config/db.config.js";
import { initSocketHandlers } from "./infrastructure/socket/socket.handler.js";
import { connectRabbitMQ } from "./infrastructure/rabbitmq/connection.js";
import { assertQueues } from "./infrastructure/rabbitmq/queue.js";
import { startNotificationConsumers } from "./modules/notification/notification.consumer.js";

const port = 3000;

// Auto-migrate on startup
try {
  console.log("Running database migrations...");
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: "postgresql://user:password@localhost:5433/meroBhariya" } });
  console.log("Migrations complete.");
} catch (err) {
  console.warn("Migration warning:", err.message);
}

const server = http.createServer(app);
const io = new socketIOServer(server, {
  cors: { origin: "http://localhost:5173", credentials: true }
});

initSocketHandlers(io);

await connectRabbitMQ();
await assertQueues();
await startNotificationConsumers(io);

server.listen(port, () => {
  console.log("listening to port " + port);
});

const shutdown = async (code, reason) => {
  console.log("Shutting down - " + reason);
  server.close(async () => {
    io.close();
    await disconnectDB();
    process.exit(code);
  });
  setTimeout(() => process.exit(code), 10_000).unref();
};

process.on("unhandledRejection", (err) => { console.error("Unhandled Rejection:", err); shutdown(1, "unhandledRejection"); });
process.on("uncaughtException",  (err) => { console.error("Uncaught Exception:", err);  shutdown(1, "uncaughtException"); });
process.on("SIGTERM", () => shutdown(0, "SIGTERM"));
process.on("SIGINT",  () => shutdown(0, "SIGINT"));

export { server, io };



