import { RedisClientType, createClient } from 'redis';
require('dotenv').config();
const stateService = require('../services/stateservices');

const redisClient = createClient({
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_HOST,
        port:19141 //+ process.env.REDIS_PORT //Converts string to number
    }
});

async function InitRedisServer(){

    redisClient.on('error', (e)=>{
        stateService.suspendOperations(e);
    });

    redisClient.on('connect', err => console.log('Redis is connected!'));
    
    await redisClient.connect();
}


export default {InitRedisServer,redisClient};