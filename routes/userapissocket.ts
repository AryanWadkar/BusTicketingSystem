import * as mongoose from 'mongoose';
import { Response,Request } from 'express';
import e = require('express');
const globalservice = require('../services/globalservices');
require('dotenv').config();
const TicketModel = require('../models/ticket');
const jwt = require("jsonwebtoken");
const userservice = require('../services/userservices');
const UserModel = require("../models/user");
const TransactionModel = require("../models/transaction");

 function getWallet(socket,io){
    socket.on('get/wallet',async (datain)=>{
        //verify jwt
        const authkey:string = socket.client.request.headers.authorization;
        const data = jwt.verify(authkey,process.env.JWT_KEY);
        if(data)
        {
            try{
                const email = data.email;
                const user = await UserModel.findOne({
                    email:email
                });
                const transactions = await TransactionModel.find({
                    email:email
                })
                const walletenc = user.wallet;
                const amt = userservice.decryptAmount(walletenc);
                socket.emit('Wallet_Succes',{
                    "wallet":amt,
                    "transactions":transactions
                });
            }catch(e){
                socket.emit('Wallet_Error',{
                    "data":String(e)
                });
            }

        }else{
            socket.emit('Wallet_Error',{
                "data":"Invalid JWT"
            });
        }

    });

}

function getBookings(socket,io){
    socket.on('get/bookings',async(datain)=>{
        //Validate jwt
        const authkey:string = socket.client.request.headers.authorization;
        const data = jwt.verify(authkey,process.env.JWT_KEY);
        if(data)
        {
            try{
                const email = data.email;
                const tickets = await TicketModel.find({
                    email:email
                });
                socket.emit('Bookings_Success',{
                    "tickets":tickets
                });
            }catch(e){
                socket.emit('Bookings_Error',{
                    "data":String(e)
                });
            }

        }else{
            socket.emit('Bookings_Error',{
                "data":"Invalid JWT"
            });
        }
    })
}

module.exports = {
    getWallet,
    getBookings
};