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

async function getWallet(socket:Socket){

    const gettingWallet=async (data)=>{
        const email = data.email;
        const user = await UserModel.findOne({
            email:email
        });
        const transactions = await TransactionModel.find({
            email:email
        })
        const walletenc = user.wallet;
        const amt = userService.decryptAmount(walletenc);
        socket.emit('Wallet_Success',{
            "wallet":amt,
            "transactions":transactions
        });
    };

    await globalService.authenticateOps(socket,gettingWallet,'Wallet_Error','get/wallet',"User");
}

async function getBookings(socket:Socket){
    const gettingBookings = async(data)=>{
        const email = data.email;
        const tickets = await TicketModel.find({
            email:email
        });
        socket.emit('MyBookings_Success',{
            "tickets":tickets
        });
    };
    
    await globalService.authenticateOps(socket,gettingBookings,'MyBookings_Error','get/bookings',"User");
}

async function busData(socket:Socket,io:Server){
        const gettingBusData=async(jwtData)=>{
            const buses = await BusModel.find();
            socket.emit('Bus_Success',{
                'data':buses
            });
            const filter = { operationType: 'insert' };
            const changeStream = BusModel.watch({fullDocument: 'updateLookup' });
            changeStream.on('change', async(change) => {
                const updatedbus = change.fullDocument;
                try{
                    const newnext = async(data)=>{  
                        //TODO: Maybe move this from a list to hashmap based on ID
                        //TODO: Maybe dont send the entire list, just send the updated document
                        let index = buses.findIndex(function (bus,i) {
                            return String(bus._id)===String(updatedbus._id)});
                        if(index!==-1)
                        {
                            buses[index]=updatedbus;
 
                        }
                        io.emit('Bus_Success',{
                            'data':buses
                        });
                    };
                    await globalService.authenticateOps(socket,newnext,'Bus_Error','get/bus',"User");
    
                }catch(err)
                {
                    console.log("BUS UPDATE ERROR",err);
                    socket.emit('Bus_Error',{
                        'data':String(err)
                    });
                }
    
              });
        };

        await globalService.authenticateOps(socket,gettingBusData,'Bus_Error','get/bus',"User");
        

}

async function bookTicket(socket:Socket,datain:Object){

    const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validateTicketReq,'Booking_Error');
        
    const bookingTicket=async(jwtData:Object)=>{
        const email = jwtData['email'];
        let src=datain['source'];
        let dest=datain['destination'];
        let time=datain['startTime'];
        const reqtime=new Date(Date.now()).toISOString();
        const bookingreqdetail={'reqtime':reqtime,'source':src,'dest':dest,'time':time};
        function bookingsuccess(bookingdata:{}){
            socket.emit('Booking_Success',{
                "data":bookingdata
            });
            BusService.sendTicketMail(email,{...bookingdata,'message':'Success'},bookingreqdetail);
        }

        function bookingfaliure(errormessage:String){
            socket.emit('Booking_Error',{
                "data":errormessage
            });
            BusService.sendTicketMail(email,{'message':errormessage},bookingreqdetail);
        }

        await BusService.bookTicket(email,src,dest,time,bookingfaliure,bookingsuccess);
    };

    if(socketMessageValid){
        await globalService.authenticateOps(socket,bookingTicket,'Booking_Error','post/book',"User");
    }
}

async function joinQueue(socket:Socket,datain:Object){
    const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validateQueueReq,'Queue_Error');

    const joiningQueue=async(jwtData:Object)=>{
        const email=jwtData['email'];
        const requestedorder = datain['preferences'];
        const queueobjs=await QueueModel.find({
            email:email
        });
        if(queueobjs.length>0)
        {
            socket.emit('Queue_Error',{
                "data":"Already in queue!"
            });
        }else{
            const newQueueobj = QueueModel({
                email:email,
                preferences:requestedorder,
                initTime:Date.now()
            });
            await newQueueobj.save().then((data)=>{
                socket.emit('Queue_Success',{
                    "data":"Added to queue successfully",
                    "qid":data
                });
            }).catch((e)=>{
                socket.emit('Queue_Error',{
                    "data":"Error adding to queue",
                    "message":String(e)
                });
            });
        }
    };

    if(socketMessageValid)
    {
        await globalService.authenticateOps(socket,joiningQueue,'Queue_Error','post/queue',"User");
    }
}

async function getQueueEntry(socket:Socket){

    const thisnext=async(data)=>{
        const email=data['email'];
        const queueobjs=await QueueModel.find({
            email:email
        });
        socket.emit("GetQueue_Success",{
            "data":queueobjs
        });
        //TODO: ON ERROR, EMIT EVENT
    };

    await globalService.authenticateOps(socket,thisnext,'Queue_Error','post/queue',"User");
}

async function getQR(socket:Socket,datain:Object){

    const socketMessageValid = middleware.socketValidationMiddleware(socket,datain,socketvalidations.validatebusIdReq,'QR_Error');
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
                socket.emit('QR_Error',{"data":res['message']});
            }else{
                socket.emit('QR_Success',{"data":res['message']});
            }
        }else{
            socket.emit('QR_Error',{"data":"No ticket found!"});
        }
    };

    if(socketMessageValid)
    {
        await globalService.authenticateOps(socket,gettingQR,'QR_Error','get/QR',"User"); 
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