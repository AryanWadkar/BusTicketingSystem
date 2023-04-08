import * as mongoose from 'mongoose';
import { Response,Request } from 'express';
import e = require('express');
const globalService = require('../services/globalservices');
require('dotenv').config();
const TicketModel = require('../models/ticket');
const jwt = require("jsonwebtoken");
const userService = require('../services/userservices');
const UserModel = require("../models/user");
const TransactionModel = require("../models/transaction");

 function getWallet(socket,io){
    socket.on('get/wallet',async (datain)=>{
        const thisnext=async (data)=>{
            const email = data.email;
            const user = await UserModel.findOne({
                email:email
            });
            const transactions = await TransactionModel.find({
                email:email
            })
            const walletenc = user.wallet;
            const amt = userService.decryptAmount(walletenc);
            socket.emit('Wallet_Success',{
                "wallet":amt,
                "transactions":transactions
            });
        };
        await globalService.authenticateOps(
            socket,thisnext,'Wallet_Error','get/wallet'
        );

        // try{
        //     const authkey:string = socket.client.request.headers.authorization;
        //     const res = await globalService.jwtAuth(authkey,"ops");
        //     if(res['status']===true)
        //     {
        //         const data=res['data'];
        //         if(data)
        //         {
        //             try{

        //             }catch(e){
        //                 socket.emit('Wallet_Error',{
        //                     "data":String(e)
        //                 });
        //             }
        
        //         }else{
        //             socket.emit('Wallet_Error',{
        //                 "data":"Invalid JWT"
        //             });
        //         }
        //     }else{
        //         socket.emit('Wallet_Error',{
        //             "data":"Invalid JWT"
        //         });
        //     }

        // }catch(e){
        //     console.log('get/wallet',e);
        //     socket.emit('Wallet_Error',{
        //         "data":String(e)
        //     });
        // }
    });

}

function getBookings(socket,io){
    socket.on('get/bookings',async(datain)=>{
        const thisnext = async(data)=>{
            const email = data.email;
            const tickets = await TicketModel.find({
                email:email
            });
            socket.emit('MyBookings_Success',{
                "tickets":tickets
            });
        };
        await globalService.authenticateOps(socket,thisnext,'MyBookings_Error','get/bookings');
        
        // try{
        //     const authkey:string = socket.client.request.headers.authorization;
        //     const res = await globalService.jwtAuth(authkey,"ops");
        //     if(res['status']===true)
        //     {
        //         const data=res['data'];
        //         if(data)
        //         {
        //             try{

        //             }catch(e){
        //                 socket.emit('Bookings_Error',{
        //                     "data":String(e)
        //                 });
        //             }
        
        //         }else{
        //             socket.emit('Bookings_Error',{
        //                 "data":"Invalid JWT"
        //             });
        //         }
        //     }else{
        //         socket.emit('Bookings_Error',{
        //             "data":"Invalid JWT"
        //         });
        //     }

        // }catch(e){
        //     console.log('get/bookings',e);
        //     socket.emit('Wallet_Error',{
        //         "data":String(e)
        //     });
        // }

    })
}

module.exports = {
    getWallet,
    getBookings
};