import * as express from 'express';
import { Response,Request } from 'express';
import { Validator} from "express-json-validator-middleware";
require('dotenv').config();
const validJson = require("../config/schema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Usermodel = require("../models/user");
const globalservice = require('../services/global_services');

const { validate } = new Validator({});

router.post("/usercheck", validate({ body: validJson.usernameSchema }),   
async (req: Request,res: Response)=>{
    try{    
    let username:string=req.body["username"];
    let useremail:string = globalservice.username_to_email(username);
    let user = await Usermodel.findOne({
        email:useremail,
        regstatus:true
    });
    if(user)
    {
        res.status(200).json({
            "status":true,
            "message":"Exists",
            "email":useremail
        });
    }else{
        await Usermodel.deleteMany({email:useremail});
        await globalservice.sendOTPMail('verify',useremail,res);
    }

}catch(e){
        console.log(e);
        res.status(400).json({
            "status":false,
            "message":String(e),
        });
    }

}
);

router.post("/verifyOTP",  validate({ body: validJson.username_opt_Schema }),  
async (req: Request,res: Response)=>{

    try{    
    let username:string=req.body["username"];
    let unhashedOTP:string = req.body["otp"];
    let emailID = globalservice.username_to_email(username);
    let onsuccess= async ()=>{
        let newuser = new Usermodel({
            email:emailID,
            regstatus:false,
        });
        await newuser.save();
    };
    await globalservice.verifyOTP(res,unhashedOTP,"registration",emailID,onsuccess);

}catch(e){
    console.log(e);
        res.status(400).json({
            "status":false,
            "message":String(e),
        });
    }

}
);

router.post("/registerUser",  validate({ body: validJson.registrationSchema }),   
async (req: Request,res: Response)=>{
    let data:object = await globalservice.jwtVerifyx(req,res,"registration");
    if(data)
    {
        try{    
            let name:string=req.body["name"];
            let pass:string = req.body["password"];
            let rollno:string = req.body["rollno"];
            let email:String = data["email"];
            const user = await Usermodel.findOne({
                email:email,
                regstatus:false,
            });
            if(!user)
            {
                res.status(404).json({
                    "status":false,
                    "message":"Invalid Registration Request!"
                });
            }else{
                const saltrounds=10;
                const hashpass = await bcrypt.hashSync(pass,saltrounds);
                const date = Date.now();
                const payload = {
                    "email":email,
                    "purpose":"ops",
                    "name":name,
                    "rollno":rollno,
                    "lat":date
                };
        
                jwt.sign(
                    payload,
                    process.env.JWT_KEY,
                    async (err, tokenx) => {
                        if(err){
                            res.status(500).json({
                                "status":false,
                                "message":"Error generating JWT",
                                "data":String(err)
                            });
                        }else{
                            await Usermodel.updateOne({
                                "email":email,
                                "regstatus":false
                            },{
                                $set:{
                                    regstatus:true,
                                    name:name,
                                    rollno:rollno,
                                    password:hashpass,
                                    logintime:date
                                }
                            }).then((data)=>{
                                res.status(200).json({
                                    "status":true,
                                    "message":"Registered Successfully!",
                                    "data":{
                                        "name":name,
                                        "rollno":rollno,
                                        "email":email,
                                        "token":tokenx,
                                    }
                                });
            
                            }).catch((err)=>{
                                res.status(500).json({
                                    "status":false,
                                    "message":"Error registering, please retry!",
                                    "data":String(err)
                                });
                            });
                        }
                    }
                );
        
            }
        
        }catch(e){
            console.log(e);
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
);

router.post("/loginUser",  validate({ body: validJson.loginSchema }),  
async (req: Request,res: Response)=>{
    try{    
    let pass:string = req.body["password"];
    let email:string = req.body["email"];
    const user = await Usermodel.findOne({
        email:email,
        regstatus:true,
    });
    if(!user)
    {
        res.status(404).json({
            "status":false,
            "message":"User not found"
        });
    }else{
        const hashedpass = user.password;
        const validity = await bcrypt.compareSync(pass,hashedpass);
        
        if(validity)
        {
            const rollno=user.rollno;
            const name = user.name;
            const date = Date.now();
            const payload = {
                "email":email,
                "purpose":"ops",
                "name":name,
                "rollno":rollno,
                "lat":date
            };
    
            jwt.sign(
                payload,
                process.env.JWT_KEY,
                async (err, tokenx) => {
                    if(err)
                    {
                        res.status(500).json({
                            "status":false,
                            "message":"Error signing JWT",
                            "data":String(err)
                        });
                    }else{
                        await Usermodel.updateOne({
                            email:email,
                        },{
                            $set:{
                                logintime:date,
                            }
                        }
                        ).then((data)=>{
                            res.status(200).json({
                                "status":true,
                                "message":"Logged in Successfully",
                                "data":{
                                    "name":name,
                                    "rollno":rollno,
                                    "email":email,
                                    "token":tokenx
                                }});
                        }).catch((error)=>{
                            res.status(500).json({
                                "status":false,
                                "message":"Error logging in!",
                                "data":String(error)
                            });
                        });

                    }

                }
            );
        }else{
            res.status(200).json({
                "status":false,
                "message":"Incorrect password!"
            });
        }
    }

}catch(e){
    console.log(e);
        res.status(400).json({
            "status":false,
            "message":String(e),
        });
    }

}
);

router.post("/resetPassSendOTP",validate({ body: validJson.usernameSchema }),async(req:Request,res:Response)=>{
    try{    
    let username:string=globalservice.username_to_email(req.body["username"]);
    let user = await Usermodel.findOne({
        email:username,
        regstatus:true
    });
    if(user)
    {
        await globalservice.sendOTPMail('reset',username,res);
    }else{
        res.status(400).json({
            "status":false,
            "message":"User not found",
            "email":username
        });

    }

}catch(e){
    console.log(e);
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
        let emailID = globalservice.username_to_email(username);
        await globalservice.verifyOTP(res,unhashedOTP,'reset',emailID)
    
    }catch(e){
        console.log(e);
            res.status(500).json({
                "status":false,
                "message":"Unkown Error",
                'data':String(e)
            });
        }
});

router.patch("/resetPassword",validate({ body: validJson.resetPassSchema }),async(req:Request,res:Response)=>{
    let data = await globalservice.jwtVerifyx(req,res,'reset');
    if(data)
    {
        try{    
            let newpass:string=req.body["newpass"];
            let email:string = data["email"];
            let user = await Usermodel.find({
                email:email
            });
            if(!user)
            {
                res.status(404).json({
                    "status":false,
                    "message":"Invalid reset request"
                });
            }else{
                const saltrounds=10;
                const hashpass = await bcrypt.hashSync(newpass,saltrounds);
                await Usermodel.updateOne({
                    email:email,
                },{
                    $set:{
                        password:hashpass,
                    }
                }
                ).then((data)=>{
                    res.status(200).json({
                        "status":true,
                        "message":"Password reset successfully"
                    });
                }).catch((error)=>{
                    res.status(500).json({
                        "status":false,
                        "message":"Error resetting password!",
                        "data":String(error)
                    });
                });
            }
        
        }catch(e){
            console.log(e);
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


});




module.exports = router;
