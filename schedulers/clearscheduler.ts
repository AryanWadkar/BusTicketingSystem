const CronJob = require('cron').CronJob;
const ticketModel = require('../models/ticket');
const queueModel = require('../models/queue');
const busModel=require('../models/bus');

const clearticket = ()=>{
    const job = new CronJob('0 0 * * *', async() =>{
        const ticketclr = await ticketModel.updateMany({},{
            email: "",
            txnId:"",
        });
        const busclr = await ticketModel.updateMany({},{
            sessionStart:false,
        });
        //TODO : clear cache as well using flush all in redis db
    }, null, true, 'Asia/Kolkata');
    job.start();
};

const clearqueue = ()=>{
    const job = new CronJob('0 0 * * *', async() =>{
        const data = await queueModel.deleteMany({});
    }, null, true, 'Asia/Kolkata');
    
    job.start();
};

module.exports={
    clearticket,
    clearqueue
}
