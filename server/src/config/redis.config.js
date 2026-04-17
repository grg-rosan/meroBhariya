import { createClient } from 'redis';

let client;

export async function getRedisClient() {
  if (client) return client;

  client = createClient({ url: process.env.REDIS_URL });
  client.on('error', (err) => console.error('[Redis]', err));
  client.on('connect', () => console.log('[Redis] Connected to Redis Cloud'));

  await client.connect();
  return client;
}