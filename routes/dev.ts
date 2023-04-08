import * as express from 'express';
const router = express.Router();
const ticketModel = require('../models/ticket');
const busModel = require('../models/bus');
router.post("/addtickets",async(req,res)=>{
    const date = new Date();
    const hrs=req.body['hrs'];
    const min = req.body['mins'];
    const src=req.body['src'];
    const dest = req.body['dest'];
    date.setHours(hrs,min,0,0);
    const newticket = new ticketModel({
        source: src,
        destination: dest,
        startTime:date,
        email: "",
        txnid:"",
    });
    await newticket.save();
    res.status(200).json({
        "status":true,
        "data":newticket
    });
})

router.post("/addbus",async(req,res)=>{
    const date = new Date();
    const hrs=req.body['hrs'];
    const min = req.body['mins'];
    const src=req.body['src'];
    const dest = req.body['dest'];
    date.setHours(hrs,min,0,0);
    const newticket = new busModel({
        source: src,
        destination: dest,
        startTime:date,
        capacity:48,
        stops:"Insti-Fresh-Sadar",
        days:["Mon,Tue,Wed,Thu,Fri"]
    });
    await newticket.save();
    res.status(200).json({
        "status":true,
        "data":newticket
    });
})

module.exports = router;