const jwt = require("jsonwebtoken");
require('dotenv').config();
import { Request, Response } from 'express';
import { Socket } from "socket.io";
const cacheService = require('./cacheservices');


async function jwtAuth(authKey:String,purpose:String): Promise<object>{
    try{
        const data = jwt.verify(authKey,process.env.JWT_KEY);
        if(data)
        {
            try{
                if(data["purpose"]===purpose)
                {
                    if(purpose=="ops")
                    {
                        const res = await cacheService.redisOperateLat(data['email'],data['lat']);
                        return {"status":res['status'],message:res['message'],data:data};
                    }else{
                        return {"status":true,message:"Verfied successfully",data:data};
                    }
        
                }else{
                    return {"status":false,"message":"Incorrect token"};
                }
            }catch(err){
                return {"status":false,"message":"Incorrect token"};
            }
    
        }else{
            return {"status":false,"message":"Invalid token signature!"};
        }
    }catch(err)
    {
        return {"status":false,"message":"Error verifying token","data":`${err}`};
    }
}

async function jwtVerifyHTTP(req:Request,res:Response,purpose:String):Promise<object | null>{
    try{
        const authHeader = req.headers.authorization;
        if (authHeader) {
            //expected token format "Bearer eyjwnfkabs...."
            const token = authHeader.split(' ')[1];
            try{
                const result = await jwtAuth(token,purpose);
                if(result['status']===true)
                {
                    return result['data'];
                }else{
                    res.status(403).json({
                        "status":false,
                        "message":"Invalid Token!",
                        "data":result['message']
                    });
                }
            }catch(err)
            {
                res.status(403).json({
                    "status":false,
                    "message":"Invalid Token!",
                    "data":err
                });
            }

        } else {
            res.status(401).json({
                "status":false,
                "message":"Token not found!"
            });
            return null;
        }
    }catch(err)
    {
        res.status(401).json({
            "status":false,
            "message":"Error retriving token",
            "data":`${err}`
        });
    }
}

async function jwtVerifySocket(socket: Socket,next:Function){
    console.log('Validating socket connection');
    const authkey:string = socket.client.request.headers.authorization;
    try{
        const res = await jwtAuth(authkey,"ops");
        if(res['status']===true)
        {
            console.log('Validated!');
            socket.emit('verify/connection',{
                'status':true,
                'message':'Connected!'
                });
        }else{
          console.log('Invalid user!');
          socket.emit('verify/connection',{
            'status':false,
            'message':'Invalid token!',
            'data':res['message']
          });
          socket.disconnect(true);
        }
    }catch(err)
    {
          console.log('Validation Error!');
          socket.emit('verify/connection',{
            'status':false,
            'message':'Token not found',
            'data':String(err)
          });
          socket.disconnect(true);
    }
    if(next!=undefined)
    {
        next();
    }

}

async function authenticateOps(socket: Socket,next:Function,route:string,access:string){
    try{
        const authkey:string = socket.client.request.headers.authorization;
        const res = await jwtAuth(authkey,"ops");
        if(res['status']===true)
        {
            try{
                
                const data=res['data'];
                if(data && data['access']==access)
                {
                    next(data);
                }else{
                    socket.emit(route,{
                        "status":false,
                        "message":"Invalid JWT"
                    });
                }
            }catch(e){
                socket.emit(route,{
                    "status":false,
                    "message":"Incorrect token",
                    "data":String(e)
                });
            }

        }else{
            socket.emit(route,{
                "status":false,
                "message":"Invalid JWT"
            });
        }

    }catch(e){
        console.log(route,e);
        socket.emit(route,{
            "status":false,
            "message":"Error retriving token",
            "data":String(e)
        });
    }
}

module.exports = {
    jwtVerifyHTTP,
    jwtVerifySocket,
    jwtAuth,
    authenticateOps
}

// const gethandm = (ticket)=>{
//     const date = ticket.startTime;
//     const formattedDate = date.toLocaleString('en-US', {timeZone:'Asia/Kolkata'});
//     const dateObj = new Date(formattedDate);
//     const hour = dateObj.getHours();
//     const minute = dateObj.getMinutes();
//     return {hour,minute};
// }