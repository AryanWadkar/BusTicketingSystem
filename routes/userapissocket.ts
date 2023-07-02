const globalService = require('../services/globalservices');
require('dotenv').config();
const TicketModel = require('../models/ticket');
const userService = require('../services/userservices');
const UserModel = require("../models/user");
const TransactionModel = require("../models/transaction");
const BusModel = require("../models/bus");
import {Socket,Server} from "socket.io";
const BusService=require('../services/busservices');
const QueueModel=require('../models/queue');
const cacheservices =require('../services/cacheservices');
const middleware = require('../config/middleware');
const socketvalidations = require('../config/socketschema');
const serverState=require('../services/stateservices');


async function getWallet(socket:Socket,datain:Object){
    const currState=serverState.correctState();
    const currOverride=serverState.getoverRideState();
    if(currOverride)
    {
      socket.emit('maintainence',{
        "message":"Server is under maintainence, please try later"
      });
    }else if(currState==="Processing")
    {
        socket.emit('get/wallet',{
            "status":false,
            "message":"Server is processing queues"
        });
    }
    else{
        const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validatePageReq,'get/wallet');
        const gettingWallet=async (jwtData:Object)=>{
            const email = jwtData['email'];
            const page=datain['page']-1;
            const perPage = 5;
            const user = await UserModel.findOne({
                email:email
            });
            const transactionsTotal = await TransactionModel.countDocuments({
                email:email
            });
            const transactions = await TransactionModel.find({
                email:email
            }).skip(perPage * page).limit(perPage);
    
            const walletenc = user.wallet;
            const amt = userService.decryptAmount(walletenc);
            socket.emit('get/wallet',{
                "status":true,
                "wallet":amt,
                "totaltxns":transactionsTotal,
                "transactions":transactions
            });
        };
    
        if(socketMessageValid) await globalService.authenticateOps(socket,gettingWallet,'get/wallet',"User");
    }
}

async function getBookings(socket:Socket){
    const currState=serverState.correctState();
    const currOverride=serverState.getoverRideState();
    if(currOverride)
    {
      socket.emit('maintainence',{
        "message":"Server is under maintainence, please try later"
      });
    }else if(currState==="Processing")
    {
        socket.emit('get/bookings',{
            "status":false,
            "message":"Server is processing queues"
        });
    }else{
        const gettingBookings = async(jwtData:Object)=>{
            const email = jwtData['email'];
            const tickets = await TicketModel.find({
                email:email
            });
            socket.emit('get/bookings',{
                "status":true,
                "tickets":tickets
            });
        };
        
        await globalService.authenticateOps(socket,gettingBookings,'get/bookings',"User");
    }
}

async function busData(socket:Socket,io:Server){
    const currOverride=serverState.getoverRideState();
    if(currOverride)
    {
      socket.emit('maintainence',{
        "message":"Server is under maintainence, please try later"
      });
    }else{
        const gettingBusData=async(jwtData)=>{
            const buses = await BusModel.find();
            socket.emit('get/bus',{
                "status":true,
                'data':buses
            });
            const changeStream = BusModel.watch({fullDocument: 'updateLookup' });
            changeStream.on('change', async(change) => {
                const updatedbus = change.fullDocument;
                try{

                    //Emits updated bus document to all connections without authenticating
                    io.emit('get/bus',{
                        "status":true,
                        'data':updatedbus
                    });

                    //here lies : Logic that authenticates and emits full updated bus list


                    // const sendingupdates = async(jwtData:Object)=>{
                    //     //DONETODO: Maybe move this from a list to hashmap based on ID
                    //     //DONETODO: Maybe dont send the entire list, just send the updated document
                    //     let index = buses.findIndex(function (bus,i) {
                    //         return String(bus._id)===String(updatedbus._id)});
                    //     if(index!==-1)
                    //     {
                    //         buses[index]=updatedbus;
 
                    //     }
                    //     io.emit('get/bus',{
                    //         "status":true,
                    //         'data':updatedbus
                    //     });
                    // };
                    // //DONETODO: Maybe don't re authenticate everyone on every single ticket purchase
                    // await globalService.authenticateOps(socket,sendingupdates,'get/bus',"User");
                    

                    //Emits updated bus document without authenticating everyone 
                    
                    
                    //Emits on
                    
                }catch(err)
                {
                    console.log("BUS UPDATE ERROR",err);
                    socket.emit('get/bus',{
                        "status":false,
                        'data':String(err)
                    });
                }
    
              });
        };

        await globalService.authenticateOps(socket,gettingBusData,'get/bus',"User");
    }
}

async function bookTicket(socket:Socket,datain:Object){
    const currState=serverState.correctState();
    const currOverride=serverState.getoverRideState();
    if(currOverride)
    {
      socket.emit('maintainence',{
        "message":"Server is under maintainence, please try later"
      });
    }else if(currState==="Ticketing")
    {
        const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validateTicketReq,'post/book');
        
        const bookingTicket=async(jwtData:Object)=>{
            const email = jwtData['email'];
            let src=datain['source'];
            let dest=datain['destination'];
            let time=datain['startTime'];
            const reqtime=new Date(Date.now()).toISOString();
            const bookingreqdetail={'reqtime':reqtime,'source':src,'dest':dest,'time':time};
            function bookingsuccess(bookingdata:{}){
                socket.emit('post/book',{
                    "status":true,
                    "data":bookingdata
                });
                BusService.sendTicketMail(email,{...bookingdata,'message':'Success'},bookingreqdetail);
            }
    
            function bookingfaliure(errormessage:String){
                socket.emit('post/book',{
                    "status":false,
                    "data":errormessage
                });
                BusService.sendTicketMail(email,{'message':errormessage},bookingreqdetail);
            }
    
            await BusService.bookTicket(email,src,dest,time,bookingfaliure,bookingsuccess);
        };
    
        if(socketMessageValid){
            await globalService.authenticateOps(socket,bookingTicket,'post/book',"User");
        }
    }else{
        socket.emit('post/book',{
            "status":false,
            "message":"Ticketing is allowed between 1:00 PM and 10:30 PM"
        });
    }
}

async function joinQueue(socket:Socket,datain:Object){

    const currState=serverState.correctState();
    const currOverride=serverState.getoverRideState();
    if(currOverride)
    {
      socket.emit('maintainence',{
        "message":"Server is under maintainence, please try later"
      });
    }else if(currState==="Queueing")
    {
        const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validateQueueReq,'post/queue');

        const joiningQueue=async(jwtData:Object)=>{
            const email=jwtData['email'];
            const requestedorder = datain['preferences'];
            const queueobjs=await QueueModel.find({
                email:email
            });
            if(queueobjs.length>0)
            {
                socket.emit('post/queue',{
                    "status":false,
                    "data":"Already in queue!"
                });
            }else{
                const newQueueobj = QueueModel({
                    email:email,
                    preferences:requestedorder,
                    initTime:Date.now()
                });
                await newQueueobj.save().then((data)=>{
                    socket.emit('post/queue',{
                        "status":true,
                        "data":"Added to queue successfully",
                        "qid":data
                    });
                }).catch((e)=>{
                    socket.emit('post/queue',{
                        "status":false,
                        "data":"Error adding to queue",
                        "message":String(e)
                    });
                });
            }
        };
    
        if(socketMessageValid)
        {
            await globalService.authenticateOps(socket,joiningQueue,'post/queue',"User");
        }
    }else{
        socket.emit('post/queue',{
            "status":false,
            "message":"Queueing is allowed between 10:00 AM and 1:00 PM"
        });
    }
}

async function getQueueEntry(socket:Socket){
    const currState=serverState.correctState();
    const currOverride=serverState.getoverRideState();
    if(currOverride)
    {
      socket.emit('maintainence',{
        "message":"Server is under maintainence, please try later"
      });
    }else if(currState==="Queueing" || currState==="Ticketing")
    {
        const gettingQueueEntry=async(data)=>{
            const email=data['email'];
            const queueobjs=await QueueModel.find({
                email:email
            });
            socket.emit("get/queue",{
                "status":true,
                "data":queueobjs
            });
            //TODO: ON ERROR, EMIT EVENT
        };
    
        await globalService.authenticateOps(socket,gettingQueueEntry,'get/queue',"User");
    }else{
        socket.emit('get/queue',{
            "status":false,
            "message":"Not allowed right now"
        });
    }
}

async function getQR(socket:Socket,datain:Object){
    const currState=serverState.correctState();
    const currOverride=serverState.getoverRideState();
    if(currOverride)
    {
      socket.emit('maintainence',{
        "message":"Server is under maintainence, please try later"
      });
    }else if(currState==="Ticketing")
    {
        const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validatebusIdReq,'get/QR');
        const gettingQR=async(jwtData:Object)=>{
    
            const email=jwtData['email'];
            const sessionBusId=datain['busId'];
            const tickets=await TicketModel.findOne(
                {
                    busId:sessionBusId,
                    email:email
                }
            );
            if(tickets)
            {
                let res = await cacheservices.redisGetCode(sessionBusId);
                if(!res['status'])
                {
                    socket.emit('get/QR',{
                        "status":false,
                        "data":res['message']});
                }else{
                    socket.emit('get/QR',{
                        "status":true,
                        "data":res['message']});
                }
            }else{
                socket.emit('get/QR',{
                    "status":false,
                    "data":"No ticket found!"});
            }
        };
    
        if(socketMessageValid)
        {
            await globalService.authenticateOps(socket,gettingQR,'get/QR',"User"); 
        }
    }else{
        socket.emit('get/QR',{
            "status":false,
            "message":"Not allowed right now"
        });
    }
}

module.exports = {
    getWallet,
    getBookings,
    busData,
    bookTicket,
    joinQueue,
    getQueueEntry,
    getQR
};