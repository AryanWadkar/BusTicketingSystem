"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
require('dotenv').config();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Usermodel = require("../models/user");
const OTPmodel = require("../models/otp");
const globalservice = require('../services/global_services');
router.post("/usercheck", async (req, res) => {
    try {
        let username = req.body["username"];
        let useremail = untoemail(username);
        let user = await Usermodel.findOne({
            email: useremail,
            regstatus: true
        });
        if (user) {
            res.status(200).json({
                "status": true,
                "message": "Exists",
                "email": useremail
            });
        }
        else {
            await Usermodel.deleteMany({ email: useremail });
            await globalservice.sendOTPMail('verify', useremail, res);
        }
    }
    catch (e) {
        console.log(e);
        res.status(400).json({
            "status": false,
            "message": e,
        });
    }
});
router.post("/verifyOTP", async (req, res) => {
    try {
        let username = req.body["username"];
        let unhashedOTP = req.body["otp"];
        let emailID = untoemail(username);
        let onsuccess = async () => {
            let newuser = new Usermodel({
                email: emailID,
                regstatus: false,
            });
            await newuser.save();
        };
        await globalservice.verifyOTP(res, unhashedOTP, "registration", emailID, onsuccess);
    }
    catch (e) {
        console.log(e);
        res.status(400).json({
            "status": false,
            "message": e,
        });
    }
});
router.post("/registerUser", async (req, res) => {
    let data = await globalservice.jwtVerifyx(req, res, "registration");
    if (data) {
        try {
            let name = req.body["name"];
            let pass = req.body["password"];
            let rollno = req.body["rollno"];
            let email = data['email'];
            const user = await Usermodel.findOne({
                email: email,
                regstatus: false,
            });
            if (!user) {
                res.status(404).json({
                    "status": false,
                    "message": "Invalid Registration Request!"
                });
            }
            else {
                const saltrounds = 10;
                const hashpass = await bcrypt.hashSync(pass, saltrounds);
                const payload = {
                    "email": email,
                    "purpose": "ops",
                    "name": name,
                    "rollno": rollno
                };
                jwt.sign(payload, process.env.JWT_KEY, async (err, tokenx) => {
                    if (err) {
                        res.status(500).json({
                            "status": false,
                            "message": "Error generating JWT",
                            "data": err
                        });
                    }
                    else {
                        await Usermodel.updateOne({
                            "email": email,
                            "regstatus": false
                        }, {
                            $set: {
                                regstatus: true,
                                name: name,
                                rollno: rollno,
                                logstatus: true,
                                password: hashpass
                            }
                        }).then((data) => {
                            res.status(200).json({
                                "status": true,
                                "message": "Registered Successfully!",
                                "data": {
                                    "name": name,
                                    "rollno": rollno,
                                    "email": email,
                                    "token": tokenx,
                                }
                            });
                        }).catch((err) => {
                            res.status(500).json({
                                "status": false,
                                "message": "Error registering, please retry!",
                                "data": err
                            });
                        });
                    }
                });
            }
        }
        catch (e) {
            console.log(e);
            res.status(400).json({
                "status": false,
                "message": e,
            });
        }
    }
    else {
        res.status(401).json({
            "status": false,
            "message": "Invalid Token!"
        });
    }
});
router.post("/loginUser", async (req, res) => {
    try {
        let pass = req.body["password"];
        let email = req.body["email"];
        const user = await Usermodel.findOne({
            email: email,
            regstatus: true,
        });
        if (!user) {
            res.status(404).json({
                "status": false,
                "message": "User not found"
            });
        }
        else {
            const hashedpass = user.password;
            const validity = await bcrypt.compareSync(pass, hashedpass);
            if (validity) {
                const rollno = user.rollno;
                const name = user.name;
                const payload = {
                    "email": email,
                    "purpose": "ops",
                    "name": name,
                    "rollno": rollno
                };
                jwt.sign(payload, process.env.JWT_KEY, async (err, tokenx) => {
                    Usermodel.updateOne({
                        email: email,
                        regstatus: false
                    }, {
                        $set: {
                            token: tokenx,
                            logstatus: true
                        }
                    });
                    res.status(200).json({
                        "status": true,
                        "message": "Logged in Successfully",
                        "data": {
                            "name": name,
                            "rollno": rollno,
                            "email": email,
                            "token": tokenx,
                        }
                    });
                });
            }
            else {
                res.status(200).json({
                    "status": false,
                    "message": "Incorrect password!"
                });
            }
        }
    }
    catch (e) {
        console.log(e);
        res.status(400).json({
            "status": false,
            "message": e,
        });
    }
});
router.post("/resetPassSendOTP", async (req, res) => {
    try {
        let username = untoemail(req.body["username"]);
        let user = await Usermodel.findOne({
            email: username,
            regstatus: true
        });
        if (user) {
            await globalservice.sendOTPMail('reset', username, res);
        }
        else {
            res.status(400).json({
                "status": false,
                "message": "User not found",
                "email": username
            });
        }
    }
    catch (e) {
        console.log(e);
        res.status(400).json({
            "status": false,
            "message": e,
        });
    }
});
router.post("/resetPassVerifyOTP", async (req, res) => {
    try {
        let username = req.body["username"];
        let unhashedOTP = req.body["otp"];
        let emailID = untoemail(username);
        await globalservice.verifyOTP(res, unhashedOTP, 'reset', emailID);
    }
    catch (e) {
        console.log(e);
        res.status(500).json({
            "status": false,
            "message": "Unkown Error",
        });
    }
});
router.post("/resetPassword", async (req, res) => {
    let data = await globalservice.jwtVerifyx(req, res, 'reset');
    if (data) {
        try {
            let newpass = req.body["newpass"];
            let email = data["email"];
            let user = await Usermodel.find({
                email: email
            });
            if (!user) {
                res.status(404).json({
                    "status": false,
                    "message": "Invalid reset request"
                });
            }
            else {
                const saltrounds = 10;
                const hashpass = await bcrypt.hashSync(newpass, saltrounds);
                await Usermodel.updateOne({
                    email: email,
                }, {
                    $set: {
                        password: hashpass,
                    }
                }).then((data) => {
                    res.status(200).json({
                        "status": true,
                        "message": "Password reset successfully"
                    });
                }).catch((error) => {
                    res.status(500).json({
                        "status": false,
                        "message": "Error resetting password!"
                    });
                });
            }
        }
        catch (e) {
            console.log(e);
            res.status(400).json({
                "status": false,
                "message": e,
            });
        }
    }
    else {
        res.status(401).json({
            "status": false,
            "message": "Invalid token"
        });
    }
});
function untoemail(inval) {
    inval = inval.toLowerCase();
    inval = inval.replaceAll(".", "");
    inval += "@iiitdmj.ac.in";
    return inval;
}
module.exports = router;
//# sourceMappingURL=userapis.js.map