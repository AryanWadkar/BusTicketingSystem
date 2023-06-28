const QueueModel = require('../models/queue');
const BusService = require('../services/busservices');
const CronJobx = require('cron').CronJob;

const processqueue= async ()=>{
    
    const queueobjs = await QueueModel.find({booking:{},txnId:""}).sort( { initTime: 1 } );
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
            //TODO: Figure out what if this update fails
            await QueueModel.updateOne({_id:docid},{booking:bookingdata,txnId:bookingdata['txnId']});
            BusService.sendQueueMail(email,{...bookingdata,'message':'Success'},{'madeat':madeat,'preferences':preferences});
        }

        function bookingfaliure(errormessage:String){
            if(errormessage=="Already Booked!" || errormessage=="Insufficient balance!" || errormessage=="No Match"){
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
        x++;
    }
        // queueobjs.forEach(async queuereq => {
            //THIS DOES NOT WAIT FOR CONTENTS WITHIN TO FINISH EXECUTING!!!!!!
        // });
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