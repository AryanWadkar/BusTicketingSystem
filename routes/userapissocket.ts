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
        try{
            const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validatePageReq,'get/wallet');
            const gettingWallet=async (jwtData:Object)=>{
                try{
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
                }catch(err)
                {
                    socket.emit('get/wallet',{
                        "status":false,
                        "message":"Error getting wallet"
                    });
                }
    
            };
        
            if(socketMessageValid) await globalService.authenticateOps(socket,gettingWallet,'get/wallet',"User");
        }catch(err)
        {
            socket.emit('get/wallet',{
                "status":false,
                "message":"Error validating token"
            });
        }

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
            try{
                const email = jwtData['email'];
                const tickets = await TicketModel.find({
                    email:email
                });
                socket.emit('get/bookings',{
                    "status":true,
                    "tickets":tickets
                });
            }catch(err)
            {
                socket.emit('get/bookings',{
                    "status":false,
                    "message":"Error retriving bookings"
                }); 
            }
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
        try{
            const gettingBusData=async(jwtData)=>{
                try{
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
                                'message':"Error retriving bus updates"
                            });
                        }
            
                      });
                }catch(err)
                {
                    socket.emit('get/bus',{
                        "status":false,
                        'message':"Error retriving bus data"
                    });
                }

            };
    
            await globalService.authenticateOps(socket,gettingBusData,'get/bus',"User");
        }catch(err)
        {
            socket.emit('get/bus',{
                "status":false,
                'message':"Error Validating Token"
            });
        }

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
        try{
            const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validateTicketReq,'post/book');
        
            const bookingTicket=async(jwtData:Object)=>{
                try{
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
                            "message":errormessage
                        });
                        BusService.sendTicketMail(email,{'message':errormessage},bookingreqdetail);
                    }
            
                    await BusService.bookTicket(email,src,dest,time,bookingfaliure,bookingsuccess);
                }catch(err)
                {
                    socket.emit('post/book',{
                        "status":false,
                        "message":"Error booking requested tickets"
                    });  
                }

            };
        
            if(socketMessageValid){
                await globalService.authenticateOps(socket,bookingTicket,'post/book',"User");
            }
        }catch(err)
        {
            socket.emit('post/book',{
                "status":false,
                "message":"Error validating token"
            });            
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
        try{
            const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validateQueueReq,'post/queue');

            const joiningQueue=async(jwtData:Object)=>{
                try{
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
                        const data = await newQueueobj.save();
                        socket.emit('post/queue',{
                            "status":true,
                            "data":"Added to queue successfully",
                            "qid":data
                        });
                    }
                }catch(err)
                {
                    socket.emit('post/queue',{
                        "status":false,
                        "message":"Error adding to queue"
                    });                   
                }
            };
        
            if(socketMessageValid)
            {
                await globalService.authenticateOps(socket,joiningQueue,'post/queue',"User");
            }
        }catch(err){
            socket.emit('post/queue',{
                "status":false,
                "message":"Error validating token"
            });
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
        try{
            const gettingQueueEntry=async(data)=>{
                try{
                    const email=data['email'];
                    const queueobjs=await QueueModel.find({
                        email:email
                    });
                    socket.emit("get/queue",{
                        "status":true,
                        "data":queueobjs
                    });
                }catch(err)
                {
                    socket.emit("get/queue",{
                        "status":false,
                        "message":"Error obtaining queue entry"
                    });
                }
            };
        
            await globalService.authenticateOps(socket,gettingQueueEntry,'get/queue',"User");
        }catch(err)
        {
            socket.emit("get/queue",{
                "status":false,
                "message":"error validating token"
            });
        }

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
        try{
            const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validatebusIdReq,'get/QR');
            const gettingQR=async(jwtData:Object)=>{
                try{
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
                }catch(err)
                {
                    socket.emit('get/QR',{
                        "status":false,
                        "message":"Error obtaining QR"
                    });  
                }
            };
            if(socketMessageValid)
            {
                await globalService.authenticateOps(socket,gettingQR,'get/QR',"User"); 
            }
        }catch(err)
        {
            socket.emit('get/QR',{
                "status":false,
                "message":"Error validating token"
            });
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