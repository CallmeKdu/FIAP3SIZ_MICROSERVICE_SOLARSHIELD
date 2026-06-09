import { Redis } from 'ioredis';

let redisClient = null;

export const connectRedis = () => {
    return new Promise((resolve, reject) => {
        const url = process.env.REDIS_URL || 'redis://localhost:6379';
        redisClient = new Redis(url);

        redisClient.on('connect', () => {
            console.log('Redis connected successfully.');
            resolve(redisClient);
        });

        redisClient.on('error', (err) => {
            console.error('Redis connection error:', err);
            reject(err);
        });
    });
};

export const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('Redis client not initialized. Call connectRedis first.');
    }
    return redisClient;
};
