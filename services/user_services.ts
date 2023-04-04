require('dotenv').config();
import { Request, Response } from 'express';
const Usermodel = require("../models/user");

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

module.exports = {
    verfiyLogin,
    verifyLoginx,
}