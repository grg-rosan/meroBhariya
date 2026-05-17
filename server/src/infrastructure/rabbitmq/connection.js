import amqplib from "amqplib";
import logger from "../logger/index.js";

let channel = null;

export async function connectRabbitMQ() {
  try {
    const conn = await amqplib.connect(
      process.env.RABBITMQ_URL ?? "amqp://localhost",
    );
    channel = await conn.createChannel();
    conn.on("error", (err) => {
      logger.error({ err }, "[RabbitMQ] Connection error");
      channel = null;
    });
    conn.on("close", () => {
      logger.warn("[RabbitMQ] Connection closed");
      channel = null;
    });
    logger.info("[RabbitMQ] Connected");
  } catch (err) {
    logger.warn(
      { err },
      "[RabbitMQ] Not available running without message queue",
    );
    channel = null;
  }
}

export function getChannel() {
  return channel;
}
