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


function getWallet(socket:Socket){
    socket.on('get/wallet',async (datain)=>{
        const thisnext=async (data)=>{
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
        await globalService.authenticateOps(
            socket,thisnext,'Wallet_Error','get/wallet',"User"
        );
    });

}

function getBookings(socket:Socket){
    socket.on('get/bookings',async(datain)=>{
        const thisnext = async(data)=>{
            const email = data.email;
            const tickets = await TicketModel.find({
                email:email
            });
            socket.emit('MyBookings_Success',{
                "tickets":tickets
            });
        };
        await globalService.authenticateOps(socket,thisnext,'MyBookings_Error','get/bookings',"User");
        
    })
}

function busData(socket:Socket,io:Server){
    socket.on('get/bus',async (datain)=>{
        const thisnext=async(data)=>{
            const buses = await BusModel.find();
            socket.emit('Bus_Success',{
                'data':buses
            });
            const filter = { operationType: 'insert' };
            const changeStream = BusModel.watch({fullDocument: 'updateLookup' });
            changeStream.on('change', async(change) => {
                //console.log('Change:', change.fullDocument);
                const updatedbus = change.fullDocument;
                try{
                    const newnext = async(data)=>{  
                        //console.log(updatedbus);                  
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
        await globalService.authenticateOps(socket,thisnext,'Bus_Error','get/bus',"User");
        
    });
}

function bookTicket(socket:Socket){
    socket.on('post/book',async(datain)=>{
        const thisnext=async(data)=>{

            const email = data['email'];
            let src=datain['source'];
            let dest=datain['destination'];
            let time=datain['startTime'];
            const reqtime=new Date(Date.now()).toISOString();
            const bookingreqdetail={'reqtime':reqtime,'source':src,'dest':dest,'time':time};
            function bookingsuccess(bookingdata:{}){
                socket.emit('Booking_Success',{
                    "data":bookingdata
                });
                BusService.sendTicketMail(email,'Success',bookingreqdetail);
            }

            function bookingfaliure(errormessage:String){
                socket.emit('Booking_Error',{
                    "data":errormessage
                });
                BusService.sendTicketMail(email,errormessage,bookingreqdetail);
            }

            await BusService.bookTicket(email,src,dest,time,bookingfaliure,bookingsuccess);
        };
        await globalService.authenticateOps(socket,thisnext,'Booking_Error','post/book',"User");
    })
}

function joinQueue(socket:Socket){
    socket.on('post/queue',async(datain)=>{
        const thisnext=async(data)=>{
            const email=data['email'];
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
        await globalService.authenticateOps(socket,thisnext,'Queue_Error','post/queue',"User");
    })
}

function getQueueEntry(socket:Socket){
    socket.on('get/queue',async(datain)=>{
        const thisnext=async(data)=>{
            const email=data['email'];
            const queueobjs=await QueueModel.find({
                email:email
            });
            socket.emit("GetQueue_Success",{
                "data":queueobjs
            });
            //ON ERROR, EMIT EVENT
        };
        await globalService.authenticateOps(socket,thisnext,'Queue_Error','post/queue',"User");
    })
}

function getQR(socket:Socket){
    socket.on('get/QR',async(datain)=>{
        const thisnext=async(data)=>{
            const email=data['email'];
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
        await globalService.authenticateOps(socket,thisnext,'QR_Error','get/QR',"User");
    })
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