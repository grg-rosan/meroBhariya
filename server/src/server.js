import http from "http"
import { Server as socketIOServer} from "socket.io"
import app from "./app.js";
import { disconnectDB } from "./config/db.config.js";
import { initSocketHandlers } from "./infrastructure/socket/socket.handler.js";
import { assertQueues } from "./infrastructure/rabbitmq/queue.js";
import { connectRabbitMQ } from "./infrastructure/rabbitmq/connection.js";
import { startNotificationConsumers } from "./modules/notification/notification.consumer.js";
import { getRedisClient } from "./config/redis.config.js";

const port = 3000;

//create raw http server from express
const server = http.createServer(app);

//initilize socket io
const io = new socketIOServer(server, {
    cors:{
        origin:"http://localhost:5173",
        credentials:true
    }
})

initSocketHandlers(io)

await connectRabbitMQ();
await assertQueues();
await startNotificationConsumers(io);
await getRedisClient();

server.listen(port,()=>{
    console.log(`listening to port ${port}`)
})

const shutdown = async (code, reason) => {
  console.log(`Shutting down — ${reason}`);
  server.close(async () => {
    io.close();           
    await disconnectDB();
    process.exit(code);
  });

  setTimeout(() => process.exit(code), 10_000).unref();
};

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  shutdown(1, "unhandledRejection");
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown(1, "uncaughtException");
});

process.on("SIGTERM", () => shutdown(0, "SIGTERM"));
process.on("SIGINT",  () => shutdown(0, "SIGINT")); 

export {server, io}