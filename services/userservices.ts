require('dotenv').config();
import {Response } from 'express';
const crypto = require('crypto');
const bcrypt = require("bcryptjs");
import * as nodemailer from 'nodemailer';
const OTPmodel = require("../models/otp");
const jwt = require("jsonwebtoken");

function encryptAmount(amount:Number):String {
    let iv = crypto.randomBytes(16);
    let key = crypto.createHash('sha256').update(String(process.env.WALLET_ENC_KEY)).digest('base64').substr(0, 32);
    let cipher = crypto.createCipheriv('aes-256-cbc',key, iv);
    let encrypted = cipher.update(amount.toString());
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
  
function decryptAmount(encryptedAmount:String):Number {
    let textParts = encryptedAmount.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let key = crypto.createHash('sha256').update(String(process.env.WALLET_ENC_KEY)).digest('base64').substr(0, 32);
    let decipher = crypto.createDecipheriv('aes-256-cbc',key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    let amt = decrypted.toString()
    return parseFloat(amt);
}

async function sendOTPMail (type:String,tosend:String,res:Response){

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


      try{
        await newOTPObj.save();
        transporter.sendMail(mailOptions, async function(err, data) {
            if (err) {
              console.log("Error " + err);
              await OTPmodel.collection.deleteMany({email:tosend});
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
      }catch(err){
        console.log("Error saving" + err);
        res.status(500).json({
          "status":false,
          "message":"Error saving OTP",
          "data":err
        });
      }
}

async function verifyOTP(res:Response,unhashedOTP:String,purpose:String,emailID:String,onsuccess?:()=>void){
    try{
        const data = await OTPmodel.find({
            email:emailID
        });
        const expiry = data[data.length-1].expiresAt;
        const hashedotp = data[data.length-1].otp;
        if(expiry < Date.now())
        {
            await OTPmodel.collection.deleteMany({email:emailID});
            res.status(404).json({
                "status":false,
                "message":"OTP Expired! Request again"
            });
        }else{
            const validity = await bcrypt.compareSync(unhashedOTP,hashedotp);
            if(validity)
            {
                await OTPmodel.deleteMany({email:emailID});
                const payload = {
                    "email":emailID,
                    "purpose":purpose
                };
                try{
                    const tokenx = jwt.sign(
                        payload,
                        process.env.JWT_KEY,
                        {expiresIn:600000}
                    );
                    if(onsuccess)
                    {
                        await onsuccess();
                    }
                    res.status(200).json({
                        "status":true,
                        "message":"OTP verified successfull!",
                        "token":tokenx,
                    });
                }catch(err)
                {
                    res.status(500).json(
                        {
                            "status":false,
                            "message":"Error signing JWT",
                            "data":err
                        }
                    );
                }
            }else{
                res.status(400).json({
                    "status":false,
                    "message":"Incorrect OTP!"
                });
            }
        }
    }catch(err)
    {
        res.status(404).json({
            "status":false,
            "message":"No corresponding OTP found, please request again!",
            "data":String(err)
        });
    }

}

function usernameToEmail(inval:string){
    inval=inval.toLowerCase();
    inval = inval.replaceAll(".","");
    inval += "@iiitdmj.ac.in";
    return inval;
}

module.exports = {
    encryptAmount,
    decryptAmount,
    sendOTPMail,
    verifyOTP,
    usernameToEmail
}