// redisClient.js
const { createClient } = require('redis');

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST,  // Use IP instead of localhost for WSL
        port: process.env.REDIS_PORT,
        connectTimeout: 10000, // 10 seconds
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('Redis max retries reached');
                return new Error('Redis max retries reached');
            }
            return Math.min(retries * 100, 3000); // Exponential backoff with max 3 seconds
        }
    }
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('Redis Client Connected');
});

redisClient.on('reconnecting', () => {
    console.log('Redis Client Reconnecting');
});

async function initRedis() {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
        throw err;
    }
}

module.exports = { redisClient, initRedis };
