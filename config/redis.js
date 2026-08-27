const redis = require('redis');

let client = null;

const connectRedis = async () => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Redis connection timeout'));
    }, 3000);

    try {
      client = redis.createClient({ url: process.env.REDIS_URL });

      client.on('error', () => {});

      client.on('ready', () => {
        clearTimeout(timeout);
        console.log('Redis connected');
        resolve(client);
      });

      client.connect().catch(() => {
        clearTimeout(timeout);
        reject(new Error('Redis not available'));
      });
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });
};

const getRedisClient = () => client;

module.exports = { connectRedis, getRedisClient };
