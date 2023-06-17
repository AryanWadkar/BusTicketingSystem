const CronJob = require('cron').CronJob;
const ticketModel = require('../models/ticket');
const queueModel = require('../models/queue');
const clearticket = () => {
    const job = new CronJob('0 0 * * *', async () => {
        const data = await ticketModel.updateMany({}, {
            email: "",
            txnid: "",
        });
    }, null, true, 'Asia/Kolkata');
    job.start();
};
const clearqueue = () => {
    const job = new CronJob('0 0 * * *', async () => {
        const data = await queueModel.deleteMany({});
    }, null, true, 'Asia/Kolkata');
    job.start();
};
module.exports = {
    clearticket,
    clearqueue
};
//# sourceMappingURL=clearscheduler.js.map