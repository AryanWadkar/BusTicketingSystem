require('dotenv').config();
import { Request, Response } from 'express';
const Usermodel = require("../models/user");
const crypto = require('crypto');

const verfiyLogin = (jwtdate:Date,serverdate:String):boolean=>{
    const newjwtdate:String = new Date(jwtdate).toISOString().replace('Z', '+00:00');
    if(newjwtdate==serverdate)
    {
        return true;
    }
    return false;
}

const verifyLoginx = async(data:any):Promise<boolean>=>{
    try{
        const email:String = data['email'];
        const lat:String = new Date(data['lat']).toISOString().replace('Z', '+00:00');
        const purpose = data['purpose'];
        if(purpose=="ops")
        {
            const user = await Usermodel.find({
                email:email,
                logintime:lat
            });
            if(user.length>0)
            {
                return true;
            }
        }
        return false;
    }catch(err)
    {
        return false;
    }
}

function encryptAmount(amount:Number):String {
    let iv = crypto.randomBytes(16);
    let key = crypto.createHash('sha256').update(String(process.env.ENC_KEY)).digest('base64').substr(0, 32);
    let cipher = crypto.createCipheriv('aes-256-cbc',key, iv);
    let encrypted = cipher.update(amount.toString());
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }
  
  function decryptAmount(encryptedAmount:String):Number {
    let textParts = encryptedAmount.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let key = crypto.createHash('sha256').update(String(process.env.ENC_KEY)).digest('base64').substr(0, 32);
    let decipher = crypto.createDecipheriv('aes-256-cbc',key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    let amt = decrypted.toString()
    return parseFloat(amt);
  }

module.exports = {
    verfiyLogin,
    verifyLoginx,
    encryptAmount,
    decryptAmount
}