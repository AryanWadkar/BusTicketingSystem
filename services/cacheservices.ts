require('dotenv').config();
const busModel = require("../models/bus");
import redisInstance from "../config/redis"
// const flatCache = require('flat-cache');
//import jwt = require("jsonwebtoken");

const redisOperateLat = async (email,lat): Promise<object>=>{
    try{
        const redislat = await redisInstance.redisClient.get(email);
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
    }catch(err){
        return {"status":false,"message":"Error validating last login"};
    }
}

const redisOperateSession = async (busID): Promise<object>=>{
    try{
        const redisCode = await redisInstance.redisClient.get(busID);
        if(!redisCode)
        {
            console.log("CODE NOT FOUND IN CACHE");
            const bus = await busModel.findOne({
                "_id":busID,
                sessionStart:true
            }).catch((err)=>{
                return {"status":false,"message":"an error occurred"}
            });
            console.log(bus);
            if(bus)
            {
                const newCode = Math.floor(100000 + Math.random() * 900000);
                const res = await redisInstance.redisClient.set(busID,newCode).catch((err)=>{
                    return {"status":false,"message":String(err)};
                }).then((data)=>{
                    return {"status":true,"message":newCode};
                });
                return res;
            }
            return {"status":false,"message":"Session Not Started yet"}
        }
        if(redisCode!="000000")
        {
            const newCode = Math.floor(100000 + Math.random() * 900000);
            const res = await redisInstance.redisClient.set(busID,newCode).catch((err)=>{
                return {"status":false,"message":String(err)};
            }).then((data)=>{
                return {"status":true,"message":newCode};
            });
            return res;
        }
        return {"status":false,"message":"Session Not Started yet"};
    }catch(err)
    {
        return {"status":false,"message":"Error operating bus session"};
    }

}

const redisGetCode = async (busID): Promise<object>=>{
    try{
        const redisCode = await redisInstance.redisClient.get(busID);
        if(!redisCode)
        {
            const bus = await busModel.findOne({
                "_id":busID,
                sessionStart:true
            });
            if(bus)
            {
                return {"status":true,"message":"Set req"};
            }
            return {"status":false,"message":"Session Not Started yet"}
        }
        if(redisCode!="000000")
        {
            return {"status":true,"message":redisCode};
        }
        return {"status":false,"message":"Session Not Started yet"};
    }catch(err)
    {
        return {"status":false,"message":"Error retriving session code"};
    }

}

// const mongoCheckLat = async(email:String,lat:String):Promise<object>=>{
//     const user = await userModel.findOne({
//         email:email
//     }).catch((err)=>{
//         return {"status":false,"message":"an error occurred"}
//     });
//     if(user)
//     {
//         if(user.loginTime.getTime()===lat)
//         {
//             return {"status":true,"message":"Verfied"}
//         }else{
//             return {"status":false,"message":"Invalid login"}
//         }
//     }else{
//         return {"status":false,"message":"Invalid login"}
//     }
// }

// const mongoSetLat = async(email:String,lat:String):Promise<object>=>{
//     await userModel.findOneAndUpdate({
//         email:email,
//         $set: { loginTime: lat },
//     }).catch((err)=>{
//         return {"status":false,"message":"an error occurred"}
//     });
//     return {"status":true,"message":"Updated"}
// }

// const diskOperateLat = async (email:String,lat:String): Promise<object>=>{
//     try{
//         var cache = flatCache.load("");
//         const xlat = cache.getKey(email);
//         if(xlat)
//         {
//             if(xlat<lat)
//             {
//                 cache.removeKey(email);
//                 cache.setKey(email,lat);
//                 cache.save(true);
//                 return {"status":true,"message":"Updated and Validated!"};
//             }else if(xlat==lat)
//             {
//                 return {"status":true,"message":"Validated!"};
//             }
//             else{
//                 return {"status":false,"message":"Invalid Token"};
//             }
//         }else{
//             cache.setKey(email,lat);
//             cache.save(true);
//             return {"status":true,"message":"Saved Validated!"};
//         }
//     }catch(err){
//         console.log(err,'caught at diskOperateLat');
//         return {"status":false,"message":"Error validating!"};
//     }
// }

module.exports={
    redisOperateLat,
    //mongoCheckLat,
    //mongoSetLat,
    //diskOperateLat,
    redisOperateSession,
    redisGetCode
}