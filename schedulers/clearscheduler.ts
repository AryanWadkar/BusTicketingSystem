const CronJob = require('cron').CronJob;
const ticketModel = require('../models/ticket');

const clearticket = ()=>{
    const job = new CronJob('0 0 * * *', () =>{
        const data = ticketModel.updateMany({},{
            email: "",
            txnid:"",
        });
    }, null, true, 'Asia/Kolkata');
    
    job.start();
};

module.exports={
    clearticket
}
