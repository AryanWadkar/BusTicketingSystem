const jwt = require("jsonwebtoken");
require('dotenv').config();
import { Request, Response } from 'express';
const bcrypt = require("bcryptjs");
import * as nodemailer from 'nodemailer';
const OTPmodel = require("../models/otp")


async function jwtVerifyx(req:Request,res:Response,purpose:String):Promise<object | null>{
    const authHeader = req.headers.authorization;
        if (authHeader) {
        //expected token format "Bearer eyjwnfkabs...."
        const token = authHeader.split(' ')[1];
        
        const data = await new Promise<object>((resolve, reject) => {
            jwt.verify(token, process.env.JWT_KEY, (err, data) => {
              if (err || data["purpose"] !== purpose) {
                res.status(403).json({
                    "status":false,
                    "message":"Unauthorized",
                    "data":err
                });
              } else {
                resolve(data);
              }
            });
          }); 
          return data;
    } else {
        res.status(401).json({
            "status":false,
            "message":"Token not found!"
        });
        return null;
    }
    
}

const sendOTPMail= async (type:String,tosend:String,res:Response) => {

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_MAIL,
          pass:process.env.SMTP_APP_PASS
        }
   });


    let otp:string = `${Math.floor(1000+Math.random()*9000)}`;
    otp = otp.trim();
    let mailOptions={};
    if(type==="verify")
    {
        mailOptions = {
            from: process.env.SMTP_MAIL,
            to: tosend,
            subject: 'Verify Email',
            html: `<p>Hello, to verify your email for BUTS, please enter the following <strong>OTP</strong> in the app:</p>
            <p><strong><span style="font-size: 20px;">${otp}</span></strong></p>
            <p>Note : This OTP <u>expires</u> in <u>1 hour</u>.</p>
            <p>Cheers!</p>
            <p><strong>Team BUTS</strong>.</p>`
          };
    }else if (type==="reset")
    {
        mailOptions = {
            from: process.env.SMTP_MAIL,
            to: tosend,
            subject: 'Password Reset',
            html: `<p>Hello,</p>
            <p>A <strong>password reset</strong> has been requested on your email, please authenticate this request by entering the following&nbsp;<strong>OTP</strong> into the app. If this request was not initiated by you please ignore this mail.<br><br><span style="font-size: 20px;"><strong>${otp}</strong></span></p>
            <p>Note: This OTP is only <u>valid for 1 hour</u>.</p>
            <p>Regards,</p>
            <p>Team BUTS.</p>`
          };
    }


      const saltrounds = 10;
      const hashedOTP = await bcrypt.hashSync(otp,saltrounds);
      const newOTPObj = new OTPmodel({
        email:tosend,
        otp:hashedOTP,
        createdAt : Date.now(),
        expiresAt : Date.now() + 3600000
      });

    await newOTPObj.save().then((data)=>{
        transporter.sendMail(mailOptions, function(err, data) {
            if (err) {
              console.log("Error " + err);
              OTPmodel.collection.deleteMany({email:tosend});
              res.status(500).json({
                "status":false,
                "message":"Error sending mail",
                "data":err
              });
            } else {
                res.status(200).json({
                    "status":true,
                    "message":"OTP sent successfully",
                  });
            }
          });
    }).catch((err)=>{
        console.log("Error saving" + err);
        res.status(500).json({
          "status":false,
          "message":"Error saving OTP",
          "data":err
        });
    });
}

const verifyOTP= async(res:Response,unhashedOTP:String,purpose:String,emailID:String,onsuccess?:()=>void)=>{
    console.log(emailID);
    await OTPmodel.find({
        email:emailID
    }).then(async (data)=>{
        const expiry = data[0].expiresAt;
        const hashedotp = data[0].otp;
        console.log(hashedotp);
        if(expiry < Date.now())
        {
            await OTPmodel.collection.deleteMany({email:emailID});
            res.status(404).json({
                "status":false,
                "message":"OTP Expired! Request again"
            });
        }else{
            const validity = await bcrypt.compareSync(unhashedOTP,hashedotp);
            console.log(validity);
            if(validity)
            {
                await OTPmodel.deleteMany({email:emailID});
                const payload = {
                    "email":emailID,
                    "purpose":purpose
                };
                jwt.sign(
                    payload,
                    process.env.JWT_KEY,
                    async (err, tokenx) => {
                        if(err)
                        {
                            res.status(500).json(
                                {
                                    "status":false,
                                    "message":"Error signing JWT",
                                    "data":err
                                }
                            );
                        }else{
                            console.log(onsuccess);
                            if(onsuccess)
                            {
                                await onsuccess();
                            }
                            res.status(200).json({
                                "status":true,
                                "message":"OTP verified successfull!",
                                "token":tokenx,
                            });
                        }

                    }
                );

            }else{
                res.status(400).json({
                    "status":false,
                    "message":"Incorrect OTP!"
                });
            }
        }
    }).catch((error)=>{
        res.status(404).json({
            "status":false,
            "message":"No corresponding OTP found, please request again!",
            "data":error
        });
    });
}

function username_to_email(inval:string){
    inval=inval.toLowerCase();
    inval = inval.replaceAll(".","");
    inval += "@iiitdmj.ac.in";
    return inval;
}

module.exports = {
    jwtVerifyx,
    sendOTPMail,
    verifyOTP,
    username_to_email
}