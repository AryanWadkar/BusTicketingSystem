"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const userModel = require("../models/user");
const flatCache = require('flat-cache');
const redis_1 = require("../config/redis");
const redisOperateLat = async (email, lat) => {
    try {
        const redislat = await redis_1.default.redisClient.get(email).catch((err) => {
            console.log(err, 'caught at diskOperateLat');
            return { "status": false, "message": "Error validating!" };
        });
        if (redislat) {
            if (redislat < lat) {
                redis_1.default.redisClient.set(email, lat);
                console.log("updating");
                return { "status": true, "message": "Updated and Validated!" };
            }
            else if (redislat == lat) {
                console.log("matched");
                return { "status": true, "message": "Validated!" };
            }
            else {
                console.log("faliure");
                return { "status": false, "message": "Invalid Token" };
            }
        }
        else {
            redis_1.default.redisClient.set(email, lat);
            console.log("setting");
            return { "status": true, "message": "Saved Validated!" };
        }
    }
    catch (err) {
        console.log(err, 'caught');
        return { "status": false, "message": "Error validating!" };
    }
};
const mongoCheckLat = async (email, lat) => {
    const user = await userModel.findOne({
        email: email
    }).catch((err) => {
        return { "status": false, "message": "an error occurred" };
    });
    if (user) {
        if (user.loginTime.getTime() === lat) {
            return { "status": true, "message": "Verfied" };
        }
        else {
            return { "status": false, "message": "Invalid login" };
        }
    }
    else {
        return { "status": false, "message": "Invalid login" };
    }
};
const mongoSetLat = async (email, lat) => {
    await userModel.findOneAndUpdate({
        email: email,
        $set: { loginTime: lat },
    }).catch((err) => {
        return { "status": false, "message": "an error occurred" };
    });
    return { "status": true, "message": "Updated" };
};
const diskOperateLat = async (email, lat) => {
    try {
        var cache = flatCache.load("");
        const xlat = cache.getKey(email);
        if (xlat) {
            if (xlat < lat) {
                cache.removeKey(email);
                cache.setKey(email, lat);
                cache.save(true);
                return { "status": true, "message": "Updated and Validated!" };
            }
            else if (xlat == lat) {
                return { "status": true, "message": "Validated!" };
            }
            else {
                return { "status": false, "message": "Invalid Token" };
            }
        }
        else {
            cache.setKey(email, lat);
            cache.save(true);
            return { "status": true, "message": "Saved Validated!" };
        }
    }
    catch (err) {
        console.log(err, 'caught at diskOperateLat');
        return { "status": false, "message": "Error validating!" };
    }
};
module.exports = {
    redisOperateLat,
    mongoCheckLat,
    mongoSetLat,
    diskOperateLat
};
//# sourceMappingURL=cacheservices.js.map