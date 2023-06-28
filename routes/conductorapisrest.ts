import * as express from 'express';
const router = express.Router();
import { Response,Request } from 'express';
import { Validator} from "express-json-validator-middleware";
const { validate } = new Validator({});
const validJson = require("../config/schema");
const userModel = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cacheService = require('../services/cacheservices');
const globalService = require('../services/globalservices');

router.post("/loginConductor",  validate({ body: validJson.loginSchema }),  
async (req: Request,res: Response)=>{
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
        const hashedpass = user.password;
        const validity = await bcrypt.compareSync(pass,hashedpass);
        
        if(validity)
        {
            const date = Date.now();
            const payload = {
                "email":email,
                "purpose":"ops",
                "lat":date,
                "access":"Conductor"
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
                        const saving = await cacheService.redisOperateLat(email,date);
                        if(saving['status']===true)
                        {
                            res.status(200).json({
                                "status":true,
                                "message":"Logged in Successfully",
                                "data":{
                                    "email":email,
                                    "token":tokenx,
                                }});

                        }else{
                            res.status(500).json({
                                "status":false,
                                "message":"Error registering, please retry!",
                                "data":saving['message']
                            });
                        }

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
    console.log('/loginUser',e);
        res.status(400).json({
            "status":false,
            "message":String(e),
        });
    }

}
);

router.post("/registerConductor",  /*validate({ body: validJson.registrationSchema }),*/   
async (req: Request,res: Response)=>{
    //let data:object = await globalService.jwtVerifyHTTP(req,res,"registration");
    if(true/*data*/)
    {
        try{   
            let pass:string = req.body["password"];
            let email:String = req.body["email"];
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
                const saltrounds=10;
                const hashpass = await bcrypt.hashSync(pass,saltrounds);
                const date = Date.now();
                const payload = {
                    "email":email,
                    "purpose":"ops",
                    "lat":date,
                    "access":"User"
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

                            await userModel.updateOne({
                                "email":email,
                                "regStatus":false
                            },{
                                $set:{
                                    regStatus:true,
                                    password:hashpass,
                                }
                            }).then(async (data)=>{
                                const saving = await cacheService.redisOperateLat(email,date);
                                if(saving['status']===true)
                                {
                                    res.status(200).json({
                                        "status":true,
                                        "message":"Registered Successfully!",
                                        "data":{
                                            "email":email,
                                            "token":tokenx,
                                        }
                                    });
                                }else{
                                    res.status(500).json({
                                        "status":false,
                                        "message":"Error registering, please retry!",
                                        "data":saving['message']
                                    });
                                }
                            }).catch(async (err)=>{
                                await userModel.updateOne({
                                    "email":email,
                                },{
                                    $set:{
                                        regStatus:false,
                                        name:"",
                                        password:"",
                                    }
                                })
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
);

module.exports = router;