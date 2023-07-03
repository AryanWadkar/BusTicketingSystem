import * as express from 'express';
const router = express.Router();
import { Response,Request } from 'express';
const adminModel = require('../models/admin');
import { Validator} from "express-json-validator-middleware";
const { validate } = new Validator({});
const validJson = require("../config/schema");
const globalService=require('../services/globalservices');
const bcrypt = require("bcryptjs");

router.post("/OTR",  validate({ body: validJson.OTRSchema }),async (req: Request,res: Response)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"godAdmin");
    if(data)
    {
        try{   
            if(req.body['magicword']===process.env.MAGIC_WORD)
            {
                let pass:string = req.body["pass"];
                let email:String = req.body["email"];
                let access:String = req.body["access"]; //Conductor, Dev
                let name:String = req.body["name"];
                const admin = await adminModel.findOne({
                    email:email,
                    access:access
                });
                if(admin)
                {
                    res.status(404).json({
                        "status":false,
                        "message":"Already exists!"
                    });
                }else{
                    const saltrounds=10;
                    const hashpass = await bcrypt.hashSync(pass,saltrounds);

                    const newAdmin = new adminModel({
                        email:email,
                        password:hashpass,
                        name:name,
                        access:access
                    });   
                    
                    await newAdmin.save();
                    res.status(200).json({
                        "status":true,
                        "message":"Registered Successfully!",
                        "data":newAdmin
                    });

                }
            }else{
                res.status(401).json({
                    "status":false,
                    "message":"Incorrect magic word ;)"
                });
            }
        }catch(e){
            console.log('/OTR',e);
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

router.post("/revoke",  validate({ body: validJson.revokeSchema }),async (req: Request,res: Response)=>{
    let data:object = await globalService.jwtVerifyHTTP(req,res,"godAdmin");
    if(data)
    {
        try{   
            if(req.body['magicword']===process.env.MAGIC_WORD)
            {
                let email:String = req.body["email"];
                let access:String = req.body["access"];
                const admin = await adminModel.deleteOne({
                    email:email,
                    access:access
                });
                res.status(200).json({
                    "status":true,
                    "data":admin
                });
            }else{
                res.status(401).json({
                    "status":false,
                    "message":"Incorrect magic word ;)"
                });
            }
        }catch(e){
            console.log('/OTR',e);
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

module.exports=router;