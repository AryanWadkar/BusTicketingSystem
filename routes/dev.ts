import * as express from 'express';
import { Validator} from "express-json-validator-middleware";
const router = express.Router();
const ticketModel = require('../models/ticket');
const busModel = require('../models/bus');
const devServices=require('../services/devservices');
const { validate } = new Validator({});
const validJson = require("../config/schema");
const queueModel = require('../models/queue');

//ADD ROUTES
router.post("/addbus",validate({ body: validJson.addBusSchema }),async(req,res)=>{
    const date = new Date();
    const hrs=req.body['hrs'];
    const min = req.body['mins'];
    const src=req.body['src'];
    const dest = req.body['dest'];
    const capacity = req.body['capacity'];
    date.setHours(hrs,min,0,0);
    try{
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
            });
        }else{
            const stops=src=="Insti"?["Insti","Fresh","Sadar"]:["Sadar","Fresh","Insti"];
            const newBus = new busModel({
                source: src,
                destination: dest,
                startTime:date,
                capacity:capacity,
                initialCapacity:capacity,
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
    }catch(err)
    {
        res.status(400).json({
            'status':false,
            'data':err
        });
    }

});


//DELETE ROUTES
router.post("/deletebus",validate({ body: validJson.busIdReqSchema }),async(req,res)=>{
    try{
        const busId=req.body['busId'];
        const data = await busModel.deleteOne({
            _id:busId
        });
        const datat = await ticketModel.deleteMany({
            busId:busId
        });
        res.status(200).json({
            'status':true,
            'data':[data,datat]
        });
    }catch(err)
    {
        res.status(500).json({
            'status':false,
            'data':err
        });
    }

});

router.get("/deleteallbus",async(req,res)=>{
    try{
        const data = await busModel.deleteMany({
        });
        const datax = await ticketModel.deleteMany({
        });
        res.status(200).json({
            'status':true,
            'data':[data,datax]
        });
    }catch(err){
        res.status(200).json({
            'status':false,
            'data':err
        });
    }

});

router.get("/deletequeue",async(req,res)=>{
    try{
        const data = await devServices.deleteQueue;
        res.status(200).json({
            'status':true,
            'data':data
        });
    }catch(err)
    {
        res.status(500).json({
            'status':false,
            'data':err
        });
    }

});


//GET ROUTES
router.get("/getallbus",async(req,res)=>{
    try{
        const data = await busModel.find({});
        res.status(200).json({
            'status':true,
            'data':data
        });
    }catch(err)
    {
        res.status(503).json({
            'status':false,
            'data':err
        });
    }

});

router.post("/gettickets",validate({ body: validJson.busIdReqSchema }),async(req,res)=>{
    const busId=req.body['busId'];
    try{
        const data = await ticketModel.find({
            busId:busId
        });
        res.status(200).json({
            'status':true,
            'data':data
        });
    }catch(err)
    {
        res.status(400).json({
            'status':false,
            'data':err
        });
    }
});

router.get("/getqueue",async(req,res)=>{
    try{
        const data = await queueModel.find({});
        res.status(200).json({
            'status':true,
            'data':data
        });
    }catch(err)
    {
        res.status(503).json({
            'status':false,
            'data':err
        });
    }

});


//PROCESS ROUTES
router.get("/processqueue",async(req,res)=>{
await devServices.processQueue();
    res.status(200).json({
        'status':true,
    });
});


//RESET ROUTES
router.post("/resettickets",validate({ body: validJson.busIdReqSchema }),async(req,res)=>{
    const busId = req.body['busId'];
    try{
        const data = await devServices.resetTickets(busId);
        res.status(200).json({
            'status':true,
            'data':data
        });
    }catch(err)
    {
        res.status(400).json({
            'status':false,
            'data':err
        });
    }

});

router.get("/resetalltickets",async(req,res)=>{
    try{
        const data = await devServices.resetTickets();
        res.status(200).json({
            'status':true,
            'data':data
        });
    }catch(err){
        res.status(400).json({
            'status':false,
            'data':err
        });
    }

});

module.exports = router;