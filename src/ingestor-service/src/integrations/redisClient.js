import Redis from 'ioredis';

// Conexão com o Redis
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = new Redis(redisUrl);

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

export default redisClient;
