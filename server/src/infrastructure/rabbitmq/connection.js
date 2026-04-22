import amqplib from "amqplib";

let channel = null;

export async function connectRabbitMQ() {
  try {
    const conn = await amqplib.connect(process.env.RABBITMQ_URL ?? "amqp://localhost");
    channel = await conn.createChannel();
    conn.on("error", (err) => { console.error("[RabbitMQ] Connection error:", err.message); channel = null; });
    conn.on("close", () => { console.warn("[RabbitMQ] Connection closed"); channel = null; });
    console.log("[RabbitMQ] Connected");
  } catch (err) {
    console.warn("[RabbitMQ] Not available — running without message queue:", err.message);
    channel = null;
  }
}

export function getChannel() {
  return channel;
}
