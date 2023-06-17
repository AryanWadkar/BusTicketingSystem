import jwt = require("jsonwebtoken");
require('dotenv').config();
const userModel = require("../models/user");
const flatCache = require('flat-cache');
import redisInstance from "../config/redis"

const redisOperateLat = async (email,lat): Promise<object>=>{
    const redislat = await redisInstance.redisClient.get(email).catch((err)=>{
        console.log(err,'caught at redisOperateLat');
        return {"status":false,"message":"Error validating!"};
    });
    if(redislat)
    {
        if(redislat<lat)
        {
            redisInstance.redisClient.set(email,lat);
            return {"status":true,"message":"Updated and Validated!"};
        }else if(redislat==lat)
        {
            return {"status":true,"message":"Validated!"};
        }
        else{
            return {"status":false,"message":"Invalid Token"};
        }
    }else{
        redisInstance.redisClient.set(email,lat);
        return {"status":true,"message":"Saved Validated!"};
    }
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

module.exports={
    redisOperateLat,
    mongoCheckLat,
    mongoSetLat,
    diskOperateLat
}