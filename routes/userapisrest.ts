import * as express from 'express';
import { Response,Request } from 'express';
import { Validator} from "express-json-validator-middleware";
require('dotenv').config();
const validJson = require("../config/schema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const userModel = require("../models/user");
const globalService = require('../services/globalservices');
const { validate } = new Validator({});
const userService = require('../services/userservices');
const cacheService = require('../services/cacheservices');
const serverState=require('../services/stateservices');
const UserModel = require("../models/user");
const TransactionModel = require("../models/transaction");
const TicketModel = require('../models/ticket');
const BusModel = require("../models/bus");
const BusService=require('../services/busservices');
const QueueModel=require('../models/queue');
const cacheservices =require('../services/cacheservices');


router.post("/usercheck", validate({ body: validJson.usernameSchema }),async (req: Request,res: Response)=>{
    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else{
        try{    
            let username:string=req.body["username"];
            let useremail:string = userService.usernameToEmail(username);
            let user = await userModel.findOne({
                email:useremail,
                regStatus:true
            });
            if(user)
            {
                res.status(200).json({
                    "status":true,
                    "message":"Exists",
                    "email":useremail
                });
            }else{
                await userModel.deleteMany({email:useremail});
                await userService.sendOTPMail('verify',useremail,res);
            }
        
        }catch(e){
                console.log('/usercheck',e);
                res.status(400).json({
                    "status":false,
                    "message":"Error checking user account",
                });
            }
    }
}
);

router.post("/verifyOTP",  validate({ body: validJson.username_opt_Schema }),async (req: Request,res: Response)=>{
    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else{
        try{    
            let username:string=req.body["username"];
            let unhashedOTP:string = req.body["otp"];
            let emailID = userService.usernameToEmail(username);
            let onsuccess= async ()=>{
                let newuser = new userModel({
                    email:emailID,
                    regStatus:false,
                });
                await newuser.save();
            };
            await userService.verifyOTP(res,unhashedOTP,"registration",emailID,onsuccess);
        
        }catch(e){
            console.log('/verifyOTP',e);
                res.status(400).json({
                    "status":false,
                    "message":"Error verifying OTP",
                });
            }
    }
}
);

router.post("/register",  validate({ body: validJson.registrationSchema }), async (req: Request,res: Response)=>{
    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else{
        let data:object = await globalService.jwtVerifyHTTP(req,res,"registration");
        if(data)
        {
            try{    
                let name:string=req.body["name"];
                let pass:string = req.body["password"];
                let rollno:string = req.body["rollNo"];
                let email:String = data["email"];
                const user = await userModel.findOne({
                    email:email,
                    regStatus:false,
                });
                if(!user)
                {
                    res.status(404).json({
                        "status":false,
                        "message":"Invalid Registration Request!"
                    });
                }else{
                    try{
                        const saltrounds=10;
                        const hashpass = await bcrypt.hashSync(pass,saltrounds);
                        const date = Date.now();
                        const initWallet = userService.encryptAmount(400);
                        const payload = {
                            "email":email,
                            "purpose":"ops",
                            "name":name,
                            "rollNo":rollno,
                            "lat":date,
                            "access":"User"
                        };
                        try{
                            const tokenx = jwt.sign(
                                payload,
                                process.env.JWT_KEY,
                                {}
                            );
                            try{
                                await userModel.updateOne({
                                    "email":email,
                                    "regStatus":false
                                },{
                                    $set:{
                                        regStatus:true,
                                        name:name,
                                        rollNo:rollno,
                                        password:hashpass,
                                        wallet:initWallet,
                                    }
                                });
                                const saving = await cacheService.redisOperateLat(email,date);
                                if(saving['status']===true)
                                {
                                    res.status(200).json({
                                        "status":true,
                                        "message":"Registered Successfully!",
                                        "data":{
                                            "name":name,
                                            "rollNo":rollno,
                                            "email":email,
                                            "token":tokenx,
                                            "wallet":userService.decryptAmount(initWallet)
                                        }
                                    });
                                }else{
                                    res.status(500).json({
                                        "status":false,
                                        "message":"Error registering, please retry!",
                                        "data":saving['message']
                                    });
                                }
                            }catch(err)
                            {
                                await userModel.updateOne({
                                    "email":email,
                                },{
                                    $set:{
                                        regStatus:false,
                                        name:"",
                                        rollNo:"",
                                        password:"",
                                        wallet:""
                                    }
                                })
                                res.status(500).json({
                                    "status":false,
                                    "message":"Error registering, please retry!",
                                    "data":String(err)
                                });
                            }
                        }catch(err)
                        {
                            
                            res.status(500).json({
                                "status":false,
                                "message":"Error generating JWT",
                                "data":String(err)
                            });
                        }
    
                    }catch(err){
                        res.status(500).json({
                            "status":false,
                            "message":"Error registering, please retry!",
                            "data":String(err)
                        });
                    }
                }
            }catch(e){
                console.log('/registerUser',e);
                    res.status(400).json({
                        "status":false,
                        "message":String(e),
                    });
            }
        }else{
            res.status(401).json({
                "status":false,
                "message":"Invalid Token!"
            });
        }
    }
}
);

router.post("/login",  validate({ body: validJson.loginSchema }),async (req: Request,res: Response)=>{
    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else{
        try{    
            let pass:string = req.body["password"];
            let email:string = req.body["email"];
            const user = await userModel.findOne({
                email:email,
                regStatus:true,
            });
            if(!user)
            {
                res.status(404).json({
                    "status":false,
                    "message":"User not found"
                });
            }else{
                try{
                    const hashedpass = user.password;
                    const validity = await bcrypt.compareSync(pass,hashedpass);
                    
                    if(validity)
                    {
                        try{
                            const rollno=user.rollNo;
                            const name = user.name;
                            const date = Date.now();
                            const walletenc = user.wallet;
                            const payload = {
                                "email":email,
                                "purpose":"ops",
                                "name":name,
                                "rollNo":rollno,
                                "lat":date,
                                "access":"User"
                            };
                    
                            const tokenx = jwt.sign(
                                payload,
                                process.env.JWT_KEY,
                                {}
                            );
                            const saving = await cacheService.redisOperateLat(email,date);
                            if(saving['status']===true)
                            {
                                res.status(200).json({
                                    "status":true,
                                    "message":"Logged in Successfully",
                                    "data":{
                                        "name":name,
                                        "rollNo":rollno,
                                        "email":email,
                                        "token":tokenx,
                                        "wallet":userService.decryptAmount(walletenc)
                                    }});
                
                            }else{
                                res.status(500).json({
                                    "status":false,
                                    "message":"Error registering, please retry!",
                                    "data":saving['message']
                                });
                            }
                        }catch(err)
                        {
                            res.status(500).json({
                                "status":false,
                                "message":"Error signing JWT",
                                "data":String(err)
                            });
                        }
                    }else{
                        res.status(200).json({
                            "status":false,
                            "message":"Incorrect password!"
                        });
                    }
                }catch(err)
                {
                    res.status(200).json({
                        "status":false,
                        "message":"Error verifying password"
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
}
);

router.post("/resetPassSendOTP",validate({ body: validJson.usernameSchema }),async(req:Request,res:Response)=>{
    
    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else{
        try{    
            let username:string=userService.usernameToEmail(req.body["username"]);
            let user = await userModel.findOne({
                email:username,
                regStatus:true
            });
            if(user)
            {
                await userService.sendOTPMail('reset',username,res);
            }else{
                res.status(400).json({
                    "status":false,
                    "message":"User not found",
                    "email":username
                });
        
            }
        
        }catch(e){
            console.log('/resetPassSendOTP',e);
                res.status(400).json({
                    "status":false,
                    "message":"Error sending OTP",
                });
            }
    }
});

router.post("/resetPassVerifyOTP",validate({ body: validJson.username_opt_Schema }),async(req:Request,res:Response)=>{
    
    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else{
        try{    
            let username:string=req.body["username"];
            let unhashedOTP:string = req.body["otp"];
            let emailID = userService.usernameToEmail(username);
            await userService.verifyOTP(res,unhashedOTP,'reset',emailID)
        
        }catch(e){
            console.log('resetPassVerifyOTP',e);
                res.status(500).json({
                    "status":false,
                    "message":"Error verifying OTP",
                    'data':String(e)
                });
        }
  }
});

router.patch("/resetPassword",validate({ body: validJson.resetPassSchema }),async(req:Request,res:Response)=>{
    
    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else{
        let data = await globalService.jwtVerifyHTTP(req,res,'reset');
        if(data)
        {
            let newpass:string=req.body["newpass"];
            let email:string = data["email"];
            try{    
                let user = await userModel.find({
                    email:email
                });
                if(!user)
                {
                    res.status(404).json({
                        "status":false,
                        "message":"Invalid reset request"
                    });
                }else{
                    try{
                        const saltrounds=10;
                        const hashpass = await bcrypt.hashSync(newpass,saltrounds);
                        
                        await userModel.updateOne({
                            email:email,
                        },{
                            $set:{
                                password:hashpass,
                            }
                        }
                        );
                        res.status(200).json({
                            "status":true,
                            "message":"Password reset successfully"
                        });
                    }catch(err)
                    {
                        res.status(500).json({
                            "status":false,
                            "message":"Error resetting password!",
                            "data":String(err)
                        });
                    }
                }
            }catch(e){
                console.log('/resetPassword',e);
                    res.status(400).json({
                        "status":false,
                        "message":"Invalid request",
                        'data':String(e)
                    });
                }
        }
    }
});

//TODO : Restore time bound ops

router.get("/busdata",async(req:Request,res:Response)=>{

    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else{
        let jwtData:object = await globalService.jwtVerifyHTTP(req,res,"ops","User");
        const datain=req.body;
        if(jwtData)
        {
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders(); // flush the headers to establish SSE with client
            try{
                const buses = await BusModel.find();
                const data = JSON.stringify({ status:true,data:buses });
                res.write(`data: ${data}\n\n`);
                const changeStream = BusModel.watch({fullDocument: 'updateLookup' });
                changeStream.on('change', async(change) => {
                    const updatedbus = change.fullDocument;
                    try{
                        const data = JSON.stringify({ status:true,data:updatedbus });
                        res.write(`data: ${data}\n\n`);
                    }catch(err)
                    {
                        console.log("BUS UPDATE ERROR",err);
                        res.status(503).json({
                            "status":false,
                            'message':"Error retriving bus updates"
                        });
                        res.end();
                    }
        
                  });
            }catch(err)
            {
                res.status(503).json({
                    "status":false,
                    'message':"Error retriving bus data"
                });
                res.end();
            }
            // If client closes connection, stop sending events
            res.on('close', () => {
                console.log('client dropped me');
                res.end();
            });
        }
    }

});

router.post("/wallet",validate({ body: validJson.pageReqSchema }),async(req:Request,res:Response)=>{
    const currState=serverState.correctState();
    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else if(false/*currState==="Processing"*/)
    {
        res.status(503).json({
            "status":false,
            "message":"Server is processing queues"
        });
    }else{
        let jwtData:object = await globalService.jwtVerifyHTTP(req,res,"ops","User");
        const datain=req.body;
        if(jwtData)
        {
            try{
                const email = jwtData['email'];
                const page=datain['page']-1;
                const perPage = 5;
                const user = await UserModel.findOne({
                    email:email
                });
                const transactionsTotal = await TransactionModel.countDocuments({
                    email:email
                });
                const transactions = await TransactionModel.find({
                    email:email
                }).skip(perPage * page).limit(perPage);
        
                const walletenc = user.wallet;
                const amt = userService.decryptAmount(walletenc);
                res.status(200).json({
                "status":true,
                "wallet":amt,
                "totaltxns":transactionsTotal,
                "transactions":transactions});
            }catch(err)
            {
                res.status(503).json({
                    "status":false,
                    "message":"Error getting wallet"
                });
            }
        }
    }
});

router.get("/bookings",async(req:Request,res:Response)=>{
    const currState=serverState.correctState();
    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else if(false/*currState==="Processing"*/)
    {
        res.status(503).json({
            "status":false,
            "message":"Server is processing queues"
        });
    }else{
        let jwtData:object = await globalService.jwtVerifyHTTP(req,res,"ops","User");
        const datain=req.body;
        if(jwtData)
        {
            try{
                const email = jwtData['email'];
                const tickets = await TicketModel.find({
                    email:email
                });
                res.status(200).json({
                    "status":true,
                    "data":tickets
                });
            }catch(err)
            {
                res.status(503).json({
                    "status":false,
                    "message":"Error retriving bookings"
                }); 
            }
        }
    }
});

router.post("/bookticket",validate({ body: validJson.ticketReqSchema }),async(req:Request,res:Response)=>{
    const currState=serverState.correctState();
    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else if(true/*currState==="Ticketing"*/)
    {       
        let jwtData:object = await globalService.jwtVerifyHTTP(req,res,"ops","User");
        const datain=req.body;
        if(jwtData)
        {
            try{
                const email = jwtData['email'];
                let src=datain['source'];
                let dest=datain['destination'];
                let time=datain['startTime'];
                const reqtime=new Date(Date.now()).toISOString();
                const bookingreqdetail={'reqtime':reqtime,'source':src,'dest':dest,'time':time};
                function bookingsuccess(bookingdata:{}){
                    res.status(200).json({
                        "status":true,
                        "data":bookingdata
                    });
                    BusService.sendTicketMail(email,{...bookingdata,'message':'Success'},bookingreqdetail);
                }
        
                function bookingfaliure(errormessage:String){
                    res.status(500).json({
                        "status":false,
                        "message":errormessage
                    });
                    BusService.sendTicketMail(email,{'message':errormessage},bookingreqdetail);
                }
        
                await BusService.bookTicket(email,src,dest,time,bookingfaliure,bookingsuccess);
            }catch(err)
            {
                res.status(200).json({
                    "status":false,
                    "message":"Error booking requested tickets"
                });  
            }
        }
    }else{
        res.status(503).json({
            "status":false,
            "message":"Ticketing is allowed between 1:00 PM and 10:30 PM"
        });
    }
});

router.post("/queue",validate({ body: validJson.queueReqSchema }),async(req:Request,res:Response)=>{
    const currState=serverState.correctState();
    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else if(true/*currState==="Queueing"*/)
    {
        let jwtData:object = await globalService.jwtVerifyHTTP(req,res,"ops","User");
        const datain=req.body;
        if(jwtData)
        {
            try{
                const email=jwtData['email'];
                const requestedorder = datain['preferences'];
                const queueobjs=await QueueModel.find({
                    email:email
                });
                if(queueobjs.length>0)
                {
                    res.status(400).json({
                        "status":false,
                        "data":"Already in queue!"
                    });
                }else{
                    const newQueueobj = QueueModel({
                        email:email,
                        preferences:requestedorder,
                        initTime:Date.now()
                    });
                    const data = await newQueueobj.save();
                    res.status(200).json({
                        "status":true,
                        "data":"Added to queue successfully",
                        "qid":data
                    });
                }
            }catch(err)
            {
                res.status(400).json({
                    "status":false,
                    "message":"Error adding to queue"
                });                   
            }
        }
    }else{
        res.status(503).json({
            "status":false,
            "message":"Queueing is allowed between 10:00 AM and 1:00 PM"
        });
    }
});

router.get("/queueentry",async(req:Request,res:Response)=>{
    const currState=serverState.correctState();
    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else if(true/*currState==="Queueing" || currState==="Ticketing"*/)
    {
        let jwtData:object = await globalService.jwtVerifyHTTP(req,res,"ops","User");
        const datain=req.body;
        if(jwtData)
        {
            try{
                const email=jwtData['email'];
                const queueobjs=await QueueModel.find({
                    email:email
                });
                res.status(200).json({
                    "status":true,
                    "data":queueobjs
                });
            }catch(err)
            {
                res.status(503).json({
                    "status":false,
                    "message":"Error obtaining queue entry"
                });
            }
        }
    }else{
        res.status(503).json({
            "status":false,
            "message":"Not allowed right now"
        });
    }
});

router.post("/QR",validate({ body: validJson.busIdReqSchema }),async(req:Request,res:Response)=>{
    const currState=serverState.correctState();
    if(serverState.getoverRideState())
    {
        res.status(503).json({
            "status":false,
            "message":"Server under maintainence",
        });
    }else if(true/*currState==="Ticketing"*/)
    {
        let jwtData:object = await globalService.jwtVerifyHTTP(req,res,"ops","User");
        const datain=req.body;
        if(jwtData)
        {
            try{
                const email=jwtData['email'];
                const sessionBusId=datain['busId'];
                const tickets=await TicketModel.findOne(
                    {
                        busId:sessionBusId,
                        email:email
                    }
                );
                if(tickets)
                {
                    let resx = await cacheservices.redisGetCode(sessionBusId);
                    if(!res['status'])
                    {
                        res.status(400).json({
                            "status":false,
                            "message":resx['message']});
                    }else{
                        res.status(200).json({
                            "status":true,
                            "message":resx['message']
                        });
                    }
                }else{
                    res.status(400).json({
                        "status":false,
                        "message":"No ticket found!"
                    });
                }
            }catch(err)
            {
                console.log(err);
                res.status(503).json({
                    "status":false,
                    "message":"Error obtaining QR"
                });  
            }
        }
    }else{
        res.status(503).json({
            "status":false,
            "message":"Not allowed right now"
        });
    }
});


module.exports = router;
