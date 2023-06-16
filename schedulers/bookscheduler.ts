const TicketModel = require('../models/ticket');
const QueueModel = require('../models/queue');
const BusService = require('../services/busservices');
const CronJobx = require('cron').CronJob;

const processqueue= async ()=>{
    
    const queueobjs = await QueueModel.find({booking:{},txnid:""});
    //Processing all requests
        queueobjs.forEach(async queuereq => {
            const preferences=queuereq['q'];
            const email=queuereq['email'];
            const docid=queuereq['id'];
            const madeat=queuereq['initTime'];
            let retry:boolean = true;
    
            async function bookingsuccess(bookingdata:{}){
                retry=false;
                await QueueModel.findOneAndUpdate({_id:docid},{booking:bookingdata,txnid:bookingdata['txnid']});
                BusService.sendQueueMail(email,{...bookingdata,'message':'Success'},{'madeat':madeat,'preferences':preferences});
            }
    
            function bookingfaliure(errormessage:String){
                console.log(errormessage);
                if(errormessage!="No tickets found!"){
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
    
            if(retry && i==n) bookingfaliure("No Match");
        });
}

//TODO: Set time for this cron job
const processQueueCron = ()=>{
    const job = new CronJobx('0 0 * * *', processqueue, null, true, 'Asia/Kolkata');
    job.start();
};

module.exports={
    processQueueCron,
    processqueue
}