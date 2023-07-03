import { Socket } from "socket.io";
const busModel = require("../models/bus");
const globalService = require('../services/globalservices');
const cacheservices =require('../services/cacheservices');
const ticketModel = require('../models/ticket');
const middleware = require('../config/middleware');
const socketvalidations = require('../config/socketschema');
const serverState=require('../services/stateservices');

async function busDataConductor(socket:Socket){
    const currOverride=serverState.getoverRideState();
    if(currOverride)
    {
      socket.emit('maintainence',{
        "message":"Server is under maintainence, please try later"
      });
    }else{
        try{
            const gettingBus=async(jwtData:Object)=>{
                const buses = await busModel.find();
                socket.emit('get/busStatic',{
                    "status":true,
                    'data':buses
                });
            };
            await globalService.authenticateOps(socket,gettingBus,'get/busStatic',"Conductor");
        }catch(err)
        {
            socket.emit('get/busStatic',{
                "status":true,
                'message':"Error retriving buses"
            });
        }

    }

}

async function busSessionStart(socket:Socket,datain:Object){
    const currOverride=serverState.getoverRideState();
    if(currOverride)
    {
      socket.emit('maintainence',{
        "message":"Server is under maintainence, please try later"
      });
    }else{    
    
        try{
            const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validatebusIdReq,'Session_Error');
            const sessionStarting=async(jwtData:Object)=>{
                try{
                    let busid=datain['busId'];
                    const busObj = await busModel.findOneAndUpdate(
                        {
                            "_id":busid
                        },
                        { sessionStart:true }
                    );
                    if(!busObj)
                    {
                        socket.emit('post/startSession',{
                            "status":false,
                            "message":"Bus not found"
                        });
                    }else{
                        const bustime = new Date(busObj.startTime);
                        const currtime= new Date();
                        const bushrs = bustime.getHours();
                        const busmins = bustime.getMinutes();
                        if(bushrs>=currtime.getHours() && busmins>=currtime.getMinutes())
                        {
                            const res = await cacheservices.redisOperateSession(busid);
                            if(!res['status'])
                            {
                                socket.emit('post/startSession',{
                                    "status":false,
                                    "message":res['message']
                                });
                            }else{
                                const tickets=await ticketModel.find(
                                    {
                                        busId:busid,
                                        txnId: { $ne: "" },
                                        email: {$ne : ""}
                                    }
                                );
                                
                                socket.emit('post/startSession',{
                                    "status":true,
                                    "data":tickets
                                });
                            }
                        }else{
                            socket.emit('post/startSession',{
                                "status":false,
                                "message":'Cannot start bus before bus start time'
                            });
                        }

                    }
                }catch(err)
                {
                    socket.emit('post/startSession',{
                        "status":false,
                        "message":'Error starting session'
                    });
                }

            };
        
            if(socketMessageValid)
            {
            await globalService.authenticateOps(socket,sessionStarting,'post/startSession',"Conductor");
            } 
        }catch(err)
        {   
            socket.emit('post/startSession',{
                "status":true,
                "message":"Error validating token"
            });    
        }

}

}

async function busScanQR(socket:Socket,datain:Object){
    const currOverride=serverState.getoverRideState();
    if(currOverride)
    {
      socket.emit('maintainence',{
        "message":"Server is under maintainence, please try later"
      });
    }else{
        try{
            const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validateScanQRReq,'Verify_Error');

            const scanningQR=async(jwtData:Object)=>{
                try{
                    let sessionBusId=datain['sessionBusId'];
                    let ticketBusId=datain['ticketBusId'];
                    let email=datain['email'];
                    let code=datain['code'];
        
                    if(sessionBusId!==ticketBusId)
                    {
                        socket.emit('post/scanQR',{
                            "status":false,
                            "message":"Bus Not matching!"});
                    }else{
        
                        const ticket = await ticketModel.findOne({
                            busId:sessionBusId,
                            email:email,
                            verified:false
                        });

                        if(!ticket)
                        {
                            socket.emit('post/scanQR',{
                                "status":false,
                                "message":"Ticket not found for this user!"
                            });
                        }else{
                            let res = await cacheservices.redisGetCode(sessionBusId);
                            if(!res['status'])
                            {
                                socket.emit('post/scanQR',{
                                    "status":false,
                                    "message":res['message']});
                            }else if(res['message']!="Set req" && code!=res['message'])
                            {
                                socket.emit('post/scanQR',{
                                    "status":false,
                                    "message":"Outdated code found, request refresh!"});
                            }
                            else{ 
                                const resx= await cacheservices.redisOperateSession(sessionBusId);
                                console.log(resx);
                                if(resx['status'])
                                {
                                    await ticketModel.updateOne({_id:ticket._id},{verified:true});
                                    socket.emit("post/scanQR",{
                                        "status":true,
                                        "message":"verified successfully"
                                    });
                                }else{
                                    socket.emit("post/scanQR",{
                                        "status":false,
                                        "message":resx['message']
                                    });     
                                }

                            }
                        }
                    }
                }catch(err)
                {
                    socket.emit('post/scanQR',{
                        "status":false,
                        "message":"Error verifying QR"
                    });
                }

            };
    
            if(socketMessageValid)
            {
                await globalService.authenticateOps(socket,scanningQR,'post/scanQR',"Conductor");
            }
        }
        catch(err)
        {
            socket.emit('post/scanQR',{
                "status":false,
                "message":"Error validating token"
            });
        }
 
    }    
}

export={
    busDataConductor,
    busSessionStart,
    busScanQR
};