import * as express from 'express';
const router = express.Router();
import { Response,Request } from 'express';
import { Validator} from "express-json-validator-middleware";
const { validate } = new Validator({});
const validJson = require("../config/schema");
const adminModel = require('../models/admin');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const globalService = require('../services/globalservices');
const devService = require('../services/devservices');
const serverState=require('../services/stateservices');

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
            const admin = await adminModel.findOne({
                email:email,
                access:"Conductor"
            });
            if(!admin)
            {
                res.status(404).json({
                    "status":false,
                    "message":"Admin not found"
                });
            }else{
                try{
                    const hashedpass = admin.password;
                    const validity = await bcrypt.compareSync(pass,hashedpass);
                    
                    if(validity)
                    {
                        const date = Date.now();
                        const payload = {
                            "email":email,
                            "purpose":"ops",
                            "access":"Conductor",
                            "lat":date
                        };
                
                        const token = jwt.sign(
                            payload,
                            process.env.JWT_KEY,
                            {expiresIn:"1d"}
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
                }catch(err)
                {
                    res.status(500).json({
                        "status":false,
                        "message":"Error logging in"
                    });
                }
        
            }
        
        }catch(e){
            console.log('/loginAdmin',e);
                res.status(400).json({
                    "status":false,
                    "message":"Error retriving credendtials"
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
            let username:string=req.body["username"];
            await devService.resetPassSendOTP(username,"Conductor",res);
            }catch(e){
                console.log('/resetPassSendOTP',e);
                res.status(400).json({
                    "status":false,
                    "message":String(e),
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
            await devService.resetPassVerifyOTP(username,unhashedOTP,res)
        }catch(e){
            console.log('/resetPassVerifyOTP',e);
                res.status(500).json({
                    "status":false,
                    "message":"Unkown Error",
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
        let data = await globalService.jwtVerifyHTTP(req,res,'adminReset');
        if(data)
        {
            try{
                let newpass:string=req.body["newpass"];
                let email:string = data["email"];
                await devService.resetPass(email,"Conductor",newpass,res);
            }catch(err)
            {   
                res.status(503).json({
                    "status":false,
                    "message":"Error resetting password"
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