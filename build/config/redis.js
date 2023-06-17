"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
require('dotenv').config();
const redisClient = (0, redis_1.createClient)({
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT //Converts string to number
    }
});
async function InitRedisServer() {
    redisClient.on('error', err => console.log('Redis Client Error', err));
    redisClient.on('connect', err => console.log('redis is connected!'));
    await redisClient.connect();
}
exports.default = { InitRedisServer, redisClient };
//# sourceMappingURL=redis.js.map