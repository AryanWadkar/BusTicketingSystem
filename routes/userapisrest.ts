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
        }else{
            res.status(401).json({
                "status":false,
                "message":"Invalid token"
            });
        }
    }
});

module.exports = router;
