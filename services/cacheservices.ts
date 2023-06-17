require('dotenv').config();
const userModel = require("../models/user");
import flatCache = require('flat-cache');
import {createClient } from 'redis';

const redisOperateLat = async (email,lat): Promise<object>=>{
    const redisClient = createClient({
        password: process.env.REDIS_PASS,
        socket: {
            host: process.env.REDIS_HOST,
            port:19141 //+ process.env.REDIS_PORT //Converts string to number
        }
    });
    
    redisClient.on('error', err => console.log('Redis Client Error'));

    redisClient.on('connect', err => console.log('redis is connected!'));
    
    await redisClient.connect();

    const redislat = await redisClient.get(email).catch(async (err)=>{
        console.log(err,'caught at redisOperateLat');
        await redisClient.disconnect();
        return {"status":false,"message":"Error validating!"};
    });
    let response={};
    if(redislat)
    {
        if(redislat<lat)
        {
            redisClient.set(email,lat);
            response= {"status":true,"message":"Updated and Validated!"};
        }else if(redislat==lat)
        {
            response={"status":true,"message":"Validated!"};
        }
        else{
            response={"status":false,"message":"Invalid Token"};
        }
    }else{
        redisClient.set(email,lat);
        response={"status":true,"message":"Saved Validated!"};
    }
    await redisClient.disconnect();
    return response;
}

const mongoCheckLat = async(email:String,lat:String):Promise<object>=>{
    const user = await userModel.findOne({
        email:email
    }).catch((err)=>{
        return {"status":false,"message":"an error occurred"}
    });
    if(user)
    {
        if(user.loginTime.getTime()===lat)
        {
            return {"status":true,"message":"Verfied"}
        }else{
            return {"status":false,"message":"Invalid login"}
        }
    }else{
        return {"status":false,"message":"Invalid login"}
    }
}

const mongoSetLat = async(email:String,lat:String):Promise<object>=>{
    await userModel.findOneAndUpdate({
        email:email,
        $set: { loginTime: lat },
    }).catch((err)=>{
        return {"status":false,"message":"an error occurred"}
    });
    return {"status":true,"message":"Updated"}
}

const diskOperateLat = async (email:String,lat:String): Promise<object>=>{
    try{
        var cache = flatCache.load("");
        const xlat = cache.getKey(email);
        if(xlat)
        {
            if(xlat<lat)
            {
                cache.removeKey(email);
                cache.setKey(email,lat);
                cache.save(true);
                return {"status":true,"message":"Updated and Validated!"};
            }else if(xlat==lat)
            {
                return {"status":true,"message":"Validated!"};
            }
            else{
                return {"status":false,"message":"Invalid Token"};
            }
        }else{
            cache.setKey(email,lat);
            cache.save(true);
            return {"status":true,"message":"Saved Validated!"};
        }
    }catch(err){
        console.log(err,'caught at diskOperateLat');
        return {"status":false,"message":"Error validating!"};
    }
}

export {
    redisOperateLat,
    mongoCheckLat,
    mongoSetLat,
    diskOperateLat
}