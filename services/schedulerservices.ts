export {};
const cron = require('node-cron');
const devServices = require('../services/devservices');

cron.schedule('0 0 * * *', devServices.resetTickets);
cron.schedule('0 0 * * *', devServices.deleteQueue);
cron.schedule('0 0 * * *', devServices.deleteOTPs);
cron.schedule('0 13 * * *', devServices.processQueue);

module.exports=cron;
