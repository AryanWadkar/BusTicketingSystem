import { RedisClientType, createClient } from 'redis';
require('dotenv').config();


const redisClient = createClient({
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_HOST,
        port:19141 //+ process.env.REDIS_PORT //Converts string to number
    }
});

async function InitRedisServer(){

    redisClient.on('error', err => console.log('Redis Client Error'));

    redisClient.on('connect', err => console.log('redis is connected!'));
    
    await redisClient.connect();
}


export default {InitRedisServer,redisClient};