const QueueModel = require('../models/queue');
const BusService = require('../services/busservices');
const CronJobx = require('cron').CronJob;
const devServices = require('../services/devservices');



//Every Day 1:30
const processQueueCron = ()=>{
    const job = new CronJobx('0 30 13 ? * * *', devServices.processqueue, null, true, 'Asia/Kolkata');
    job.start();
};

module.exports={
    processQueueCron
}