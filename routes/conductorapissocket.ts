import { Socket } from "socket.io";
const busModel = require("../models/bus");
const globalService = require('../services/globalservices');
const cacheservices =require('../services/cacheservices');
const ticketModel = require('../models/ticket');
const middleware = require('../config/middleware');
const socketvalidations = require('../config/socketschema');


async function busDataConductor(socket:Socket){

    const gettingBus=async(jwtData:Object)=>{
        const buses = await busModel.find();
        socket.emit('get/busStatic',{
            "status":true,
            'data':buses
        });
    };
    await globalService.authenticateOps(socket,gettingBus,'get/busStatic',"Conductor");
}

async function busSessionStart(socket:Socket,datain:Object){

    const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validatebusIdReq,'Session_Error');
    const sessionStarting=async(jwtData:Object)=>{
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
                "data":"Bus not found"
            });
        }else{
            const res = await cacheservices.redisOperateSession(busid);
            if(!res['status'])
            {
                socket.emit('post/startSession',{
                    "status":false,
                    "data":res['message']
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
        }
    };

    if(socketMessageValid)
    {
    await globalService.authenticateOps(socket,sessionStarting,'post/startSession',"Conductor");
    } 
}

async function busScanQR(socket:Socket,datain:Object){

    const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validateScanQRReq,'Verify_Error');

        const scanningQR=async(jwtData:Object)=>{
            let sessionBusId=datain['sessionBusId'];
            let ticketBusId=datain['ticketBusId'];
            let email=datain['email'];
            let code=datain['code'];

            if(sessionBusId!==ticketBusId)
            {
                socket.emit('post/scanQR',{
                    "status":false,
                    "data":"Bus Not matching!"});
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
                        "data":"Ticket not found for this user!"});
                }else{
                    let res = await cacheservices.redisGetCode(sessionBusId);
                    if(!res['status'])
                    {
                        socket.emit('post/scanQR',{
                            "status":false,
                            "data":res['message']});
                    }else if(res['message']!="Set req" && code!=res['message'])
                    {
                        socket.emit('post/scanQR',{
                            "status":false,
                            "data":"Outdated code found, request refresh!"});
                    }
                    else{ 
                        await ticketModel.updateOne({busId:sessionBusId},{verified:true});
                        res = await cacheservices.redisOperateSession(sessionBusId);
            
                        socket.emit("post/scanQR",{
                            "status":true,
                            "data":"verified successfully"
                        });
                    }
                }
            }
        };

        if(socketMessageValid)
        {
            await globalService.authenticateOps(socket,scanningQR,'post/scanQR',"Conductor");
        }   
        
}

export={
    busDataConductor,
    busSessionStart,
    busScanQR
};