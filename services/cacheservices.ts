import jwt = require("jsonwebtoken");
require('dotenv').config();
const redis = require("redis");
const userModel = require("../models/user");
const flatCache = require('flat-cache');

const operateLat = async (email:String,lat:String): Promise<object>=>{
    try{
        const client = redis.createClient({ url:'rediss://red-cgo7naou9tun42vtd2qg:Lu2uHE7cYdgKMTDS9DcpAHTXki92kGCP@oregon-redis.render.com:6379'});
        console.log('connecting');
        await client.connect();
        console.log('connected!');
        client.SADD("emails", email, async (err1, reply) => {
            console.log(err1);
            if (err1) {
                return {"status":false,"message":String(err1)};
            } else {
              if (reply === 1) {
                console.log('Adding');
                client.HSET(email, "loginTime", lat, (err2, reply) => {
                    console.log(err2);
                    if (err2) {
                        return {"status":false,"message":String(err2)};
                    } else {
                        return {"status":true,"message":"Validated!"};
                    }
                });
              } else {
                console.log('Saving');
                client.HGET(email, "loginTime", (err3, oldLoginTime) => {
                    console.log(err3);
                    if (err3) {
                        return {"status":false,"message":String(err3)};
                    } else {
                    if (lat >= oldLoginTime) {
                        client.HSET(email, "loginTime", lat, (err4, reply) => {
                        console.log(err4);
                        if (err4) {
                            return {"status":false,"message":String(err4)};
                        } else {
                            return {"status":true,"message":"Validated!"};
                        }
                        });
                    } else {
                        return {"status":false,"message":"Token Expired!"};
                    }
                    }
                });
              }
            }
          });
    client.quit();
    }catch(err){
        console.log(err,'caught');
        return {"status":false,"message":"Error validating!"};
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
                cache.save();
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
            cache.save();
            return {"status":true,"message":"Validated!"};
        }
    }catch(err){
        console.log(err,'caught at diskOperateLat');
        return {"status":false,"message":"Error validating!"};
    }
}

module.exports={
    operateLat,
    mongoCheckLat,
    mongoSetLat,
    diskOperateLat
}