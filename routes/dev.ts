import * as express from 'express';
const router = express.Router();
const TicketModel = require('../models/ticket');

router.get("/addtickets",async(req,res)=>{
    const date = new Date();
    date.setHours(16,30,0,0);
    const newticket = new TicketModel({
        source: "A",
        destination: "B",
        startTime:date,
        email: "",
        txnid:"",
    });
    await newticket.save();
    res.status(200).json({
        "status":true
    });
})

module.exports = router;