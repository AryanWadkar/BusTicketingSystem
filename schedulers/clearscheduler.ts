export {};
const CronJob = require('cron').CronJob;
const devServices = require('../services/devservices');

const clearticket = ()=>{
    const job = new CronJob('0 0 * * *', devServices.clearTickets, null, true, 'Asia/Kolkata');
    job.start();
};

const clearqueue = ()=>{
    const job = new CronJob('0 0 * * *', devServices.deleteQueue, null, true, 'Asia/Kolkata');
    job.start();
};

module.exports={
    clearticket,
    clearqueue
}
