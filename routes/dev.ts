import * as express from 'express';
const router = express.Router();
const ticketModel = require('../models/ticket');
const busModel = require('../models/bus');
const queueModel = require('../models/queue');
const userService = require('../services/userservices');
//
const bookingscheduler=require('../schedulers/bookscheduler');

//RESET ROUTES
router.post("/resettickets",async(req,res)=>{
    const hrs=req.body['hrs'];
    const min = req.body['mins'];
    const src=req.body['src'];
    const dest = req.body['dest'];
    const date = new Date();
    date.setHours(hrs,min,0,0);
    const data = await ticketModel.updateMany({
        source: src,
        destination: dest,
        startTime:date,
    },
    {
        email: "",
        txnId:"",
    }
    );
    res.status(200).json({
        'status':true,
        'data':data
    });
});

router.get("/resetalltickets",async(req,res)=>{
    const data = await ticketModel.updateMany({},{
        email: "",
        txnId:"",
    });
    res.status(200).json({
        'status':true,
        'data':data
    });
});

router.post("/resetConductorPass",async(req,res)=>{
    try{
        const newpass:string=res['newpass'];
        await userService.resetPass("busutilityticketingsystem@gmail.com",newpass);
    }catch(e){
        res.status(200).json({
            'status':true,
        });
    }

});

//ADD ROUTES
router.post("/addbus",async(req,res)=>{
    const date = new Date();
    const hrs=req.body['hrs'];
    const min = req.body['mins'];
    const src=req.body['src'];
    const dest = req.body['dest'];
    const capacity = req.body['capacity'];
    date.setHours(hrs,min,0,0);
    const busexist = await busModel.find({
        source: src,
        destination: dest,
        startTime:date,
    });
    if(busexist.length>0)
    {
        res.status(400).json({
            'status':false,
            'data':'bus already exists'
        })
    }else{
        const stops=src=="Insti"?["Insti","Fresh","Sadar"]:["Sadar","Fresh","Insti"];
        const newBus = new busModel({
            source: src,
            destination: dest,
            startTime:date,
            capacity:capacity,
            stops:stops,
            days:["Mon","Tue","Wed","Thu","Fri"]
        });
        await newBus.save();

        for(let i:number=0; i<capacity; i++)
        {
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
                txnId:"",
                busId:newBus._id
            });
            await newticket.save();
        }
        res.status(200).json({
            "status":true,
            "data":newBus
        });
    }
});

//TODO: Figure out register conductor

//GET ROUTES
router.get("/getallbus",async(req,res)=>{
    const data = await busModel.find({});
    res.status(200).json({
        'status':true,
        'data':data
    });
});

router.post("/getbus",async(req,res)=>{
    const date = new Date();
    const hrs=req.body['hrs'];
    const min = req.body['mins'];
    const src=req.body['src'];
    const dest = req.body['dest'];
    date.setHours(hrs,min,0,0);
    const data = await busModel.find({
        source: src,
        destination: dest,
        startTime:date,
    });
    res.status(200).json({
        'status':true,
        'data':data
    });
});

router.post("/gettickets",async(req,res)=>{
    const date = new Date();
    const hrs=req.body['hrs'];
    const min = req.body['mins'];
    const src=req.body['src'];
    const dest = req.body['dest'];
    date.setHours(hrs,min,0,0);
    const data = await ticketModel.find({
        source: src,
        destination: dest,
        startTime:date,
    });
    res.status(200).json({
        'status':true,
        'data':data
    });
});


//DELETE ROUTES
router.post("/deletebus",async(req,res)=>{
    const date = new Date();
    const hrs=req.body['hrs'];
    const min = req.body['mins'];
    const src=req.body['src'];
    const dest = req.body['dest'];
    date.setHours(hrs,min,0,0);
    const data = await busModel.deleteOne({
        source: src,
        destination: dest,
        startTime:date,
    });
    const datat = await ticketModel.deleteMany({
        source: src,
        destination: dest,
        startTime:date,
    });
    res.status(200).json({
        'status':true,
        'data':[data,datat]
    });
});

router.get("/clearallbus",async(req,res)=>{
    const data = await busModel.deleteMany({
    });
    res.status(200).json({
        'status':true,
        'data':data
    });
});

router.get("/clearalltickets",async(req,res)=>{
    const data = await ticketModel.deleteMany({
    });
    res.status(200).json({
        'status':true,
        'data':data
    });
});

router.get("/clearqueue",async(req,res)=>{
    const data = await queueModel.deleteMany({
    });
    res.status(200).json({
        'status':true,
        'data':data
    });
});

//PROCESS ROUTES

router.get("/processqueue",async(req,res)=>{
    bookingscheduler.processqueue();
    res.status(200).json({
        'status':true,
    });
});

module.exports = router;