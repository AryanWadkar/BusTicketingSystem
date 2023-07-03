import * as express from 'express';
import { Validator} from "express-json-validator-middleware";
import { Response,Request } from 'express';
const router = express.Router();
const ticketModel = require('../models/ticket');
const busModel = require('../models/bus');
const devServices=require('../services/devservices');
const { validate } = new Validator({});
const validJson = require("../config/schema");
const queueModel = require('../models/queue');
const userModel = require('../models/user');
const userService = require('../services/userservices');
const adminModel = require('../models/admin');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const globalService = require('../services/globalservices');
const devService = require('../services/devservices');

const stateservices=require('../services/stateservices');

//ADD ROUTES
router.post("/addbus",validate({ body: validJson.addBusSchema }),async(req,res)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"Dev");
    if(data)
    {
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
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid Token!"
        });
    }
});


//DELETE ROUTES
router.post("/deletebus",validate({ body: validJson.busIdReqSchema }),async(req,res)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"Dev");
    if(data)
    {
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
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid Token!"
        });
    }
});

router.get("/deleteallbus",async(req,res)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"Dev");
    if(data)
    {
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
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid Token!"
        });
    }
});

router.get("/deletequeue",async(req,res)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"Dev");
    if(data)
    {
        try{
            const data = await devServices.deleteQueue();
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
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid Token!"
        });
    }
});

router.post("/deleteuser",validate({ body: validJson.usernameSchema }),async(req,res)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"Dev");
    if(data)
    {
        try{
            const email=req.body['username'];
            const data = await userModel.deleteOne({
                email:email
            });
            //TODO: maybe also clear txns
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
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid Token!"
        });
    }
});

router.get("/deleteotps",async(req,res)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"Dev");
    if(data)
    {
        try{
            const data = await devServices.deleteOTPs();
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
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid Token!"
        });
    }
});


//GET ROUTES
router.get("/getallbus",async(req,res)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"Dev");
    if(data)
    {
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
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid Token!"
        });
    }


});

router.post("/gettickets",validate({ body: validJson.busIdReqSchema }),async(req,res)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"Dev");
    if(data)
    {
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
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid Token!"
        });
    }

});

router.get("/getqueue",async(req,res)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"Dev");
    if(data)
    {
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
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid Token!"
        });
    }
});


//PROCESS ROUTES
router.get("/processqueue",async(req,res)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"Dev");
    if(data)
    {
        await devServices.processQueue();
        res.status(200).json({
            'status':true,
        });
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid Token!"
        });
    }

});


//RESET ROUTES
router.post("/resettickets",validate({ body: validJson.busIdReqSchema }),async(req,res)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"Dev");
    if(data)
    {
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
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid Token!"
        });
    }
});

router.get("/resetalltickets",async(req,res)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"Dev");
    if(data)
    {
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
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid Token!"
        });
    }
});

router.post("/resetwallet",validate({ body: validJson.usernameSchema }),async(req,res)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"Dev");
    if(data)
    {
        try{
            const email=req.body['username'];
            const initWallet = userService.encryptAmount(200);
            const data = await userModel.updateOne({
                "email":email,
            },{
                wallet:initWallet
            });
            //TODO: maybe clear txns for this user as well
            res.status(200).json({
                'status':false,
                'data':data
            });
        
            }catch(err)
            {
                res.status(503).json({
                    'status':false,
                    'data':err
                });
            }
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid Token!"
        });
    }
});


//DEV CRUD

router.post("/login",validate({ body: validJson.loginSchema }),  
async (req: Request,res: Response)=>{
    try{    
    let pass:string = req.body["password"];
    let email:string = req.body["email"];
    const admin = await adminModel.findOne({
        email:email,
        access:"Dev"
    });
    if(!admin)
    {
        res.status(404).json({
            "status":false,
            "message":"Admin not found"
        });
    }else{
        const hashedpass = admin.password;
        const validity = await bcrypt.compareSync(pass,hashedpass);
        
        if(validity)
        {
            const payload = {
                "email":email,
                "purpose":"Dev",
                "access":"Dev"
            };
    
            const token = jwt.sign(
                payload,
                process.env.JWT_KEY,
                {
                    expiresIn: "1h"
                }
            );
            if(token)
            {
                res.status(200).json({
                    "status":true,
                    "message":"Logged in Successfully",
                    "data":{
                        "email":email,
                        "token":token,
                    }});
            }else{
                res.status(500).json({
                    "status":false,
                    "message":"Error signing JWT"
                });
            }
        }else{
            res.status(200).json({
                "status":false,
                "message":"Incorrect password!"
            });
        }
    }

}catch(e){
    console.log('/loginUser',e);
        res.status(400).json({
            "status":false,
            "message":String(e),
        });
    }

}
);

router.post("/resetPassSendOTP",validate({ body: validJson.usernameSchema }),async(req:Request,res:Response)=>{
    try{    
    let username:string=req.body["username"];
    await devService.resetPassSendOTP(username,"Dev",res);
    }catch(e){
        console.log('/resetPassSendOTP',e);
        res.status(400).json({
            "status":false,
            "message":String(e),
        });
    }
});

router.post("/resetPassVerifyOTP",validate({ body: validJson.username_opt_Schema }),async(req:Request,res:Response)=>{

    try{    
        let username:string=req.body["username"];
        let unhashedOTP:string = req.body["otp"];
        await devService.resetPassVerifyOTP(username,unhashedOTP,res)
    }catch(e){
        console.log('/resetPassVerifyOTP',e);
            res.status(500).json({
                "status":false,
                "message":"Unkown Error",
                'data':String(e)
        });
    }
});

router.patch("/resetPassword",validate({ body: validJson.resetPassSchema }),async(req:Request,res:Response)=>{
    let data = await globalService.jwtVerifyHTTP(req,res,'adminReset');
    if(data)
    {
        let newpass:string=req.body["newpass"];
        let email:string = data["email"];
        await devService.resetPass(email,"Dev",newpass,res);
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid token"
        });
    }
});

router.get("/toggleSuspension",async(req:Request,res:Response)=>{
    let data = await globalService.jwtVerifyHTTP(req,res,'Dev');
    if(data)
    {
        try{
            const data = stateservices.toggleState();
            res.status(503).json({
                "status":false,
                "message":`set to ${data}`
            });
        }catch(e){
            res.status(503).json({
                "status":false,
                "message":String(e)
            });
        }
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid token"
        });
    }

    
});

module.exports = router;