import jwt = require("jsonwebtoken");
require('dotenv').config();
import { Request, Response } from 'express';
import { Socket } from "socket.io";
import * as cacheService from './cacheservices';


async function jwtAuth(authKey:String,purpose:String): Promise<object>{
    const data = jwt.verify(authKey,process.env.JWT_KEY);
    if(data)
    {
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
    }else{
        return {"status":false,"message":"Invalid token signature!"};
    }

}

async function jwtVerifyHTTP(req:Request,res:Response,purpose:String):Promise<object | null>{
    const authHeader = req.headers.authorization;
        if (authHeader) {
        //expected token format "Bearer eyjwnfkabs...."
        const token = authHeader.split(' ')[1];
        
        const data = await new Promise<object>(async (resolve, reject) => {
            const result = await jwtAuth(token,purpose);
            if(result['status']===true)
            {
                resolve(result['data']);
            }else{
                res.status(403).json({
                    "status":false,
                    "message":"Invalid Token!",
                    "data":result['message']
                });
            }
          }); 
          return data;
    } else {
        res.status(401).json({
            "status":false,
            "message":"Token not found!"
        });
        return null;
    }
    
}

async function jwtVerifySocket(socket: Socket,next){
    console.log('Validating socket connection');
    const authkey:string = socket.client.request.headers.authorization;
    try{
        const res = await jwtAuth(authkey,"ops");
        if(res['status']===true)
        {
            console.log('Validated!');
            socket.emit('Connection_Success',{
                'status':true,
                'message':'Connected!'
                });
        }else{
          console.log('Invalid user!');
          socket.emit('Connection_Error',{
            'status':false,
            'message':'Invalid token!',
            'data':res['message']
          });
          socket.disconnect(true);
        }
    }catch(err)
    {
          console.log('Validation Error!');
          socket.emit('Connection_Error',{
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

async function authenticateOps(socket: Socket,next,error:string,route:string){
    try{
        const authkey:string = socket.client.request.headers.authorization;
        const res = await jwtAuth(authkey,"ops");
        if(res['status']===true)
        {
            const data=res['data'];
            if(data)
            {
                try{
                    next(data);
                }catch(e){
                    socket.emit(error,{
                        "data":String(e)
                    });
                }
    
            }else{
                socket.emit(error,{
                    "data":"Invalid JWT"
                });
            }
        }else{
            socket.emit(error,{
                "data":"Invalid JWT"
            });
        }

    }catch(e){
        console.log(route,e);
        socket.emit(error,{
            "data":String(e)
        });
    }
}

export{
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