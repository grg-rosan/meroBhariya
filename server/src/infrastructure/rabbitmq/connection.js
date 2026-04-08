import amqplib from "amqplib";

let channel = null;

export async function connectRabbitMQ() {
  const conn = await amqplib.connect(process.env.RABBITMQ_URL ?? "amqp://localhost");
  channel = await conn.createChannel();

  conn.on("error", (err) => console.error("[RabbitMQ] Connection error:", err.message));
  conn.on("close", () => console.warn("[RabbitMQ] Connection closed"));

  console.log("[RabbitMQ] Connected");
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  return channel;
}