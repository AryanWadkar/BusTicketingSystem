"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const globalservice = require('../services/globalservices');
require('dotenv').config();
const TicketModel = require('../models/ticket');
const jwt = require("jsonwebtoken");
const userservice = require('../services/userservices');
const UserModel = require("../models/user");
const TransactionModel = require("../models/transaction");
const BusModel = require("../models/bus");
const globalService = require('../services/globalservices');
function busData(socket, io) {
    socket.on('get/busold', async (data) => {
        //await globalservice.verifySocket(socket,()=>{},false); restore later
        const tickets = await TicketModel.find();
        const buses = tickets.reduce((acc, ticket) => {
            if (ticket.email === '') {
                const existingBus = acc.find(bus => bus.time.getHours() === ticket.startTime.getHours() && bus.time.getMinutes() === ticket.startTime.getMinutes());
                if (existingBus) {
                    existingBus.count++;
                }
                else {
                    acc.push({ time: ticket.startTime, count: 1, src: ticket.source, dest: ticket.destination });
                }
            }
            return acc;
        }, []);
        socket.emit('Bus_data', {
            'data': buses
        });
        const filter = { operationType: 'insert' };
        const changeStream = TicketModel.watch({ fullDocument: 'updateLookup' });
        changeStream.on('change', (change) => {
            console.log('Change:', change.fullDocument);
            const ticket = change.fullDocument;
            try {
                const bus = buses.find(bus => bus.time.getHours() === ticket.startTime.getHours() && bus.time.getMinutes() === ticket.startTime.getMinutes());
                if (bus) {
                    if (ticket.email === "" && ticket.txnid === "") {
                        bus.count++;
                    }
                    else {
                        bus.count--;
                    }
                }
                else {
                    buses.push({ time: ticket.startTime, count: 1, src: ticket.source, dest: ticket.destination });
                }
                //add jwt verification again
                io.emit('Bus_data', {
                    'data': buses
                });
            }
            catch (err) {
                console.log(err);
            }
        });
    });
    socket.on('get/bus', async (datain) => {
        const thisnext = async (data) => {
            const buses = await BusModel.find();
            socket.emit('Bus_Success', {
                'data': buses
            });
            const filter = { operationType: 'insert' };
            const changeStream = BusModel.watch({ fullDocument: 'updateLookup' });
            changeStream.on('change', async (change) => {
                console.log('Change:', change.fullDocument);
                const updatedbus = change.fullDocument;
                try {
                    const newnext = async (data) => {
                        console.log(updatedbus);
                        let index = buses.findIndex(function (bus, i) {
                            return String(bus._id) === String(updatedbus._id);
                        });
                        if (index !== -1) {
                            buses[index] = updatedbus;
                        }
                        io.emit('Bus_Success', {
                            'data': buses
                        });
                    };
                    await globalService.authenticateOps(socket, newnext, 'Bus_Error', 'get/bus');
                }
                catch (err) {
                    console.log(err);
                    socket.emit('Bus_Error', {
                        'data': String(err)
                    });
                }
            });
        };
        await globalService.authenticateOps(socket, thisnext, 'Bus_Error', 'get/bus');
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
        //                 socket.emit('Bus_Error',{
        //                     'data':String(e)
        //                 });
        //             }
        //         }else{
        //             socket.emit('Bus_Error',{
        //                 "data":"Invalid JWT"
        //             });
        //         }
        //     }else{
        //         socket.emit('Bus_Error',{
        //             "data":"Invalid JWT"
        //         });
        //     }
        // }catch(e){
        //     socket.emit('Bus_Error',{
        //         "data":String(e)
        //     });
        // }
    });
}
function bookTicket(socket, io) {
    socket.on('post/book', async (datain) => {
        const thisnext = async (data) => {
            const session = await mongoose.startSession();
            session.startTransaction();
            const email = data['email'];
            const user = await UserModel.findOne({
                email: email
            });
            const walletenc = user.wallet;
            const ticketex = await TicketModel.find({
                email: email,
                source: datain['source'],
                destination: datain['destination'],
                startTime: datain['startTime'],
            });
            if (ticketex.length > 0) {
                socket.emit('Booking_Error', {
                    "data": "Already booked!"
                });
            }
            else {
                const ticket = await TicketModel.findOne({
                    source: datain['source'],
                    destination: datain['destination'],
                    startTime: datain['startTime'],
                    email: { $eq: "" },
                    txnid: { $eq: "" }
                }).session(session);
                if (!ticket) {
                    socket.emit('Booking_Error', {
                        "data": "No tickets found!"
                    });
                }
                else {
                    try {
                        let amt = userservice.decryptAmount(walletenc);
                        if (amt < 20) {
                            socket.emit('Booking_Error', {
                                "data": "Insufficient balance!"
                            });
                        }
                        else {
                            amt = amt - 20;
                            const encamt = userservice.encryptAmount(amt);
                            await UserModel.updateOne({ email: email }, { $set: { wallet: encamt } }, { session }).session(session);
                            const transaction = new TransactionModel({
                                amount: 20,
                                email: email,
                                date: new Date(),
                                type: '-'
                            });
                            const newtransaction = await transaction.save({ session });
                            await TicketModel.updateOne({ _id: ticket._id }, { $set: { txnid: newtransaction._id, email: email } }, { session }).session(session);
                            await BusModel.updateOne({
                                source: datain['source'],
                                destination: datain['destination'],
                                startTime: datain['startTime'],
                            }, { $inc: { capacity: -1 } }, { session }).session(session);
                            await session.commitTransaction();
                            socket.emit('Booking_Success', {
                                "data": "Booked successfully!"
                            });
                        }
                    }
                    catch (e) {
                        await session.abortTransaction();
                        socket.emit('Booking_Error', {
                            "data": String(e)
                        });
                    }
                    finally {
                        session.endSession();
                    }
                }
            }
        };
        await globalService.authenticateOps(socket, thisnext, 'Booking_Error', 'post/book');
    });
}
module.exports = {
    busData,
    bookTicket
};
//# sourceMappingURL=busapis.js.map