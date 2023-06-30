import mongoose from "mongoose";
const ticketModel = require('../models/ticket');
const queueModel = require('../models/queue');
const busModel=require('../models/bus');
const busService = require('../services/busservices');
import redisInstance from "../config/redis"

async function resetTickets(busId:string|null):Promise<Array<Object>>{
    const session = await mongoose.startSession();
    session.startTransaction();
    if(busId)
    {
        try{
            const ticketclr = await ticketModel.updateMany({
                busId:busId
            },{
                email: "",
                txnId:"",
            },
            { session } 
            ).session(session);
            const busclr = await busModel.updateMany({
                _id:busId
            },{
                $set:{"sessionStart":false,
                "capactiy":"$initialCapacity"
                }
            },
            { session }
            ).session(session);

            await session.commitTransaction();

            return [ticketclr,busclr];
        }catch(err)
        {
            await session.abortTransaction();
            return [String(err)];
        }finally{
            await session.endSession();
        }

        
    }else{

        try{        
            const ticketclr = await ticketModel.updateMany({},{
                email: "",
                txnId:"",
            },
            { session }).session(session);
            const busclr = await busModel.updateMany({
        
            },
                {
                    $set:{"sessionStart":false,
                    "capactiy":"$initialCapacity"
                    }
                },
                { session }
            
        ).session(session);

            redisInstance.redisClient.flushAll();
            await session.commitTransaction();
            return [ticketclr,busclr];
        }catch(err)
        {
            await session.abortTransaction();
            return [String(err)];
        }finally{
            await session.endSession();
        }
    }
}

async function deleteQueue():Promise<object>{
    const data = await queueModel.deleteMany({});
    return data;
}

async function processQueue(){
    let page=0;
    const perPage = 10;
    const totalReqs = await queueModel.countDocuments({
        booking:{},txnId:""
    });
    console.log("total requests:"+totalReqs);
    while((page*perPage)<totalReqs)
    {
        const queueobjs = await queueModel.find({booking:{},txnId:""}).sort( { initTime: 1 } ).skip(perPage * page).limit(perPage);
        let noofjobs:number=queueobjs.length;
        console.log("processing"+noofjobs+"docs rn in iteration "+page);
        let currjobno:number=0;
        while(currjobno<noofjobs)
        {
            const queuereq=queueobjs[currjobno];
            const preferences=queuereq['preferences'];
            const email=queuereq['email'];
            const docid=queuereq['id'];
            const madeat=queuereq['initTime'];
            let retry:boolean = true;
            function bookingsuccess(bookingdata:{}){
                retry=false;       
                busService.sendQueueMail(email,{...bookingdata,'message':'Success'},{'madeat':madeat,'preferences':preferences});
            }
    
            function bookingfaliure(errormessage:String){
                if(errormessage=="Already Booked!" || errormessage=="Insufficient balance!" || errormessage=="No Match at end"){
                    retry=false;
                    busService.sendQueueMail(email,{'message':errormessage},{'madeat':madeat,'preferences':preferences});
                }
            }
    
            async function updatequeue(bookingdata:{},session:mongoose.mongo.ClientSession){
                await queueModel.updateOne({_id:docid},{booking:bookingdata,txnId:bookingdata['txnId']}).session(session);
            } 
    
            //Processing individual preferences;
            let i:number=0;
            let n:number=preferences.length;
            while(retry && i<n)
            {
                let src=preferences[i]['source'];
                let dest=preferences[i]['destination'];
                let time=preferences[i]['startTime'];
                await busService.bookTicket(email,src,dest,time,bookingfaliure,bookingsuccess,updatequeue);
                i++;
            }
    
            if(retry && i==n) bookingfaliure("No Match at end");
            currjobno++;
        }
        page++;
    }

        // queueobjs.forEach(async queuereq => {
            //THIS DOES NOT WAIT FOR CONTENTS WITHIN TO FINISH EXECUTING!!!!!!
        // });
}

module.exports={resetTickets,deleteQueue,processQueue};