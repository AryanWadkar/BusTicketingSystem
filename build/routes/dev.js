"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const ticketModel = require('../models/ticket');
const busModel = require('../models/bus');
//RESET ROUTES
router.post("/resettickets", async (req, res) => {
    const hrs = req.body['hrs'];
    const min = req.body['mins'];
    const src = req.body['src'];
    const dest = req.body['dest'];
    const date = new Date();
    date.setHours(hrs, min, 0, 0);
    const data = await ticketModel.updateMany({
        source: src,
        destination: dest,
        startTime: date,
    }, {
        email: "",
        txnid: "",
    });
    res.status(200).json({
        'status': true,
        'data': data
    });
});
router.get("/resetalltickets", async (req, res) => {
    const data = await ticketModel.updateMany({}, {
        email: "",
        txnid: "",
    });
    res.status(200).json({
        'status': true,
        'data': data
    });
});
//ADD ROUTES
router.post("/addbus", async (req, res) => {
    const date = new Date();
    const hrs = req.body['hrs'];
    const min = req.body['mins'];
    const src = req.body['src'];
    const dest = req.body['dest'];
    const capacity = req.body['capacity'];
    date.setHours(hrs, min, 0, 0);
    const busexist = await busModel.find({
        source: src,
        destination: dest,
        startTime: date,
    });
    if (busexist.length > 0) {
        res.status(400).json({
            'status': false,
            'data': 'bus already exists'
        });
    }
    else {
        const newBus = new busModel({
            source: src,
            destination: dest,
            startTime: date,
            capacity: capacity,
            stops: "Insti-Fresh-Sadar",
            days: ["Mon,Tue,Wed,Thu,Fri"]
        });
        await newBus.save();
        for (let i = 0; i < capacity; i++) {
            const date = new Date();
            const hrs = req.body['hrs'];
            const min = req.body['mins'];
            const src = req.body['src'];
            const dest = req.body['dest'];
            date.setHours(hrs, min, 0, 0);
            const newticket = new ticketModel({
                source: src,
                destination: dest,
                startTime: date,
                email: "",
                txnid: "",
            });
            await newticket.save();
        }
        res.status(200).json({
            "status": true,
            "data": newBus
        });
    }
});
//GET ROUTES
router.get("/getallbus", async (req, res) => {
    const data = await busModel.find({});
    res.status(200).json({
        'status': true,
        'data': data
    });
});
router.post("/getbus", async (req, res) => {
    const date = new Date();
    const hrs = req.body['hrs'];
    const min = req.body['mins'];
    const src = req.body['src'];
    const dest = req.body['dest'];
    date.setHours(hrs, min, 0, 0);
    const data = await busModel.find({
        source: src,
        destination: dest,
        startTime: date,
    });
    res.status(200).json({
        'status': true,
        'data': data
    });
});
router.post("/gettickets", async (req, res) => {
    const date = new Date();
    const hrs = req.body['hrs'];
    const min = req.body['mins'];
    const src = req.body['src'];
    const dest = req.body['dest'];
    date.setHours(hrs, min, 0, 0);
    const data = await ticketModel.find({
        source: src,
        destination: dest,
        startTime: date,
    });
    res.status(200).json({
        'status': true,
        'data': data
    });
});
//DELETE ROUTES
router.post("/deletebus", async (req, res) => {
    const date = new Date();
    const hrs = req.body['hrs'];
    const min = req.body['mins'];
    const src = req.body['src'];
    const dest = req.body['dest'];
    date.setHours(hrs, min, 0, 0);
    const data = await busModel.deleteOne({
        source: src,
        destination: dest,
        startTime: date,
    });
    const datat = await ticketModel.deleteMany({
        source: src,
        destination: dest,
        startTime: date,
    });
    res.status(200).json({
        'status': true,
        'data': [data, datat]
    });
});
router.get("/clearallbus", async (req, res) => {
    const data = await busModel.deleteMany({});
    res.status(200).json({
        'status': true,
        'data': data
    });
});
router.get("/clearalltickets", async (req, res) => {
    const data = await ticketModel.deleteMany({});
    res.status(200).json({
        'status': true,
        'data': data
    });
});
module.exports = router;
//# sourceMappingURL=dev.js.map