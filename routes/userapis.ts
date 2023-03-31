import * as express from 'express';
import { Response,Request } from 'express';
import * as nodemailer from 'nodemailer';
require('dotenv').config();
const { check, validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const Usermodel = require("../models/user");
const OTPmodel = require("../models/otp")
const globalservice = require('../services/global_services');



router.post("/usercheck",    
async (req: Request,res: Response)=>{
    try{    
    let username:string=req.body["username"];
    let useremail:string = untoemail(username);
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
        res.status(400).json({
            "status":false,
            "message":e,
        });
    }

}
);

router.post("/verifyOTP",    
async (req: Request,res: Response)=>{

    try{    
    let username:string=req.body["username"];
    let unhashedOTP:string = req.body["otp"];
    let emailID = untoemail(username);
    let onsuccess= async ()=>{
        let newuser = new Usermodel({
            email:emailID,
            regstatus:false,
        });
        await newuser.save();
    };
    await globalservice.verifyOTP(res,unhashedOTP,"registration",emailID,onsuccess);

}catch(e){
        res.status(400).json({
            "status":false,
            "message":e,
        });
    }

}
);

router.post("/registerUser",    
async (req: Request,res: Response)=>{
    let data:object = await globalservice.jwtVerifyx(req,res,"registration");
    if(data)
    {
        try{    
            let name:string=req.body["name"];
            let pass:string = req.body["password"];
            let rollno:string = req.body["rollno"];
            let email:String = data['email'];
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
                const payload = {
                    "email":email,
                    "purpose":"ops",
                    "name":name,
                    "rollno":rollno
                };
        
                jwt.sign(
                    payload,
                    process.env.JWT_KEY,
                    async (err, tokenx) => {
                        if(err){
                            res.status(500).json({
                                "status":false,
                                "message":"Error generating JWT",
                                "data":err
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
                                    logstatus:true,
                                    password:hashpass
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
                                    "data":err
                                });
                            });
                        }
                    }
                );
        
            }
        
        }catch(e){
                res.status(400).json({
                    "status":false,
                    "message":e,
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

router.post("/loginUser",    
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
            const payload = {
                "email":email,
                "purpose":"ops",
                "name":name,
                "rollno":rollno
            };
    
            jwt.sign(
                payload,
                process.env.JWT_KEY,
                async (err, tokenx) => {
                    Usermodel.updateOne({
                        email:email,
                        regstatus:false
                    },{
                        $set:{
                            token:tokenx,
                            logstatus:true
                        }
                    });
                    res.status(200).json({
                        "status":true,
                        "message":"Logged in Successfully",
                        "data":{
                            "name":name,
                            "rollno":rollno,
                            "email":email,
                            "token":tokenx,
                        }
                    });
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
        res.status(400).json({
            "status":false,
            "message":e,
        });
    }

}
);

router.post("/resetPassSendOTP",async(req:Request,res:Response)=>{
    try{    
    let username:string=untoemail(req.body["username"]);
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
        res.status(400).json({
            "status":false,
            "message":e,
        });
    }
});

router.post("/resetPassVerifyOTP",async(req:Request,res:Response)=>{

    try{    
        let username:string=req.body["username"];
        let unhashedOTP:string = req.body["otp"];
        let emailID = untoemail(username);
        await globalservice.verifyOTP(res,unhashedOTP,'reset',emailID)
    
    }catch(e){
            res.status(500).json({
                "status":false,
                "message":"Unkown Error",
            });
        }
});

router.post("/resetPassword",async(req:Request,res:Response)=>{
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
                        "message":"Error resetting password!"
                    });
                });
            }
        
        }catch(e){
                res.status(400).json({
                    "status":false,
                    "message":e,
                });
            }
    }else{
        res.status(401).json({
            "status":false,
            "message":"Invalid token"
        });
    }


});


function untoemail(inval:string){
    inval=inval.toLowerCase();
    inval = inval.replaceAll(".","");
    inval += "@iiitdmj.ac.in";
    return inval;
}

module.exports = router;
