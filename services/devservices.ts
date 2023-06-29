export {};
const ticketModel = require('../models/ticket');
const queueModel = require('../models/queue');
const busModel=require('../models/bus');
const BusService = require('../services/busservices');
const redis=require('../config/redis');

async function resetTickets(busId:string|null):Promise<Array<Object>>{
    if(busId)
    {
        const ticketclr = await ticketModel.updateMany({
            busId:busId
        },{
            email: "",
            txnId:"",
        });
        const busclr = await busModel.updateMany({
            _id:busId
        },[
            {
                $set:{"sessionStart":false,}
            },
            {
                $set:{"capactiy":"$initialCapacity"}
            }
        ]
        );
        return [ticketclr,busclr]
    }else{
        const ticketclr = await ticketModel.updateMany({},{
            email: "",
            txnId:"",
        });
        const busclr = await busModel.updateMany({
    
        },[
            {
                $set:{"sessionStart":false,}
            },
            {
                $set:{"capactiy":"$initialCapacity"}
            }
        ]
        );
        return [ticketclr,busclr];
        redis.redisClient.flushAll();
    }
}

async function deleteQueue():Promise<object>{
    const data = await queueModel.deleteMany({});
    return data;
}

async function processQueue(){
    
    const queueobjs = await queueModel.find({booking:{},txnId:""}).sort( { initTime: 1 } );
    let noofjobs:number=queueobjs.length;
    let x:number=0;
    while(x<noofjobs)
    {
        const queuereq=queueobjs[x];
        const preferences=queuereq['preferences'];
        const email=queuereq['email'];
        const docid=queuereq['id'];
        const madeat=queuereq['initTime'];
        let retry:boolean = true;
        async function bookingsuccess(bookingdata:{}){
            retry=false;
            //Mongo Db handles rewrite to DB 
            await queueModel.updateOne({_id:docid},{booking:bookingdata,txnId:bookingdata['txnId']});
            BusService.sendQueueMail(email,{...bookingdata,'message':'Success'},{'madeat':madeat,'preferences':preferences});
        }

        function bookingfaliure(errormessage:String){
            if(errormessage=="Already Booked!" || errormessage=="Insufficient balance!" || errormessage=="No Match at end"){
                retry=false;
                BusService.sendQueueMail(email,{'message':errormessage},{'madeat':madeat,'preferences':preferences});
            }
        }

        //Processing individual preferences;
        let i:number=0;
        let n:number=preferences.length;
        while(retry && i<n)
        {
            let src=preferences[i]['source'];
            let dest=preferences[i]['destination'];
            let time=preferences[i]['startTime'];
            await BusService.bookTicket(email,src,dest,time,bookingfaliure,bookingsuccess);
            i++;
        }

        if(retry && i==n) bookingfaliure("No Match at end");
        x++;
    }
        // queueobjs.forEach(async queuereq => {
            //THIS DOES NOT WAIT FOR CONTENTS WITHIN TO FINISH EXECUTING!!!!!!
        // });
}

module.exports={resetTickets,deleteQueue,processQueue};