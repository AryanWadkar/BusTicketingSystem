import * as mongoose from 'mongoose';
import { Response,Request } from 'express';
const globalservice = require('../services/global_services');
require('dotenv').config();
const TicketModel = require('../models/ticket');
const jwt = require("jsonwebtoken");
const userservice = require('../services/user_services');
const Usermodel = require("../models/user");
const TransactionModel = require("../models/transaction");

 function busData(socket,io){
    socket.on('get/bus',async (data)=>{
        //await globalservice.verifySocket(socket,()=>{},false); restore later
        const tickets = await TicketModel.find();
        const buses = tickets.reduce((acc, ticket) => {
            if (ticket.user_email === '') {
              const existingBus = acc.find(bus => 
                bus.time.getHours()===ticket.startTime.getHours() && bus.time.getMinutes()===ticket.startTime.getMinutes());
              if (existingBus) {
                existingBus.count++;
              } else {
                acc.push({ time:ticket.startTime, count: 1,src:ticket.source,dest:ticket.destination });
              }
            }
            return acc;
          }, []);
        socket.emit('Bus_data',{
            'data':buses
        });
        const filter = { operationType: 'insert' };
        const changeStream = TicketModel.watch({fullDocument: 'updateLookup' });
        changeStream.on('change', (change) => {
            console.log('Change:', change.fullDocument);
            const ticket = change.fullDocument;
            try{
                const bus = buses.find(bus=>bus.time.getHours()===ticket.startTime.getHours() && bus.time.getMinutes()===ticket.startTime.getMinutes());
                if(bus)
                {
                    if(ticket.user_email==="" && ticket.txnid==="")
                    {
                        bus.count++;
                    }else{
                        bus.count--;
                    }
                }else{
                    buses.push({ time:ticket.startTime, count: 1,src:ticket.source,dest:ticket.destination });
                }
                //add jwt verification again
                io.emit('Bus_data',{
                    'data':buses
                });
            }catch(err)
            {
                console.log(err);
            }

          });
    });

}

function bookTicket(socket,io){
    socket.on('post/book',async(datain)=>{
        //Validate jwt
        try{
            const session = await mongoose.startSession();
            session.startTransaction();
            const authkey:string = socket.client.request.headers.authorization;
            const data = jwt.verify(authkey,process.env.JWT_KEY);
            if(data)
            {
                const email = data['email'];
                const user = await Usermodel.findOne({
                    email:email
                });
                const walletenc = user.wallet;
                const ticketex = await TicketModel.find({
                    user_email:email
                });
                //console.log('ticket ex',ticketex);
                if(ticketex.length>0)
                {
                    socket.emit('Booking_Error',{
                        "data":"Already booked!"
                    });
                }else{
                    const ticket = await TicketModel.findOne(
                        {
                          source:datain['src'],
                          destination:datain['dest'],
                          startTime:datain['time'],
                          user_email: { $eq: "" },
                          txnid:{ $eq: "" }
                        }
                      ).session(session); 
                      //console.log('ticket found',ticket);
                        if(!ticket)
                        {
                            socket.emit('Booking_Error',{
                                "data":"No tickets found!"
                            });
                        }else{
                            try
                            {
                                let amt = userservice.decryptAmount(walletenc);
                                if(amt<20)
                                {
                                    socket.emit('Booking_Error',{
                                        "data":"Insufficient balance!"
                                    });
                                }else{
                                    amt=amt-20;
                                    //console.log('amt',amt);
                                    const encamt = userservice.encryptAmount(amt);
                                    await Usermodel.updateOne(
                                        { email: email },
                                        { $set: { wallet: encamt } },
                                        { session }
                                      ).session(session);


                                      const transaction = new TransactionModel({
                                        amount: 20,
                                        user_email: email,
                                        date: new Date(),
                                        type: '-'
                                      });
                                
    
                                      const newtransaction= await transaction.save({session});
                                      await TicketModel.updateOne(
                                        { _id: ticket._id },
                                        { $set: { txnid: newtransaction._id,user_email:email } },
                                        { session }
                                      ).session(session);
                                      await session.commitTransaction();
                                      socket.emit('Booking_Success',{
                                        "data":"Booked successfully!"
                                    });
                            }
                            }catch(e){
                                await session.abortTransaction();
                                socket.emit('Booking_Error',{
                                    "data":String(e)
                                });
                            }finally {
                                session.endSession();
                            }
                    }
                }

            }else{
                socket.emit('Booking_Error',{
                    "data":"INVALID jwt"
                });
            }
            

        }catch(e){
            socket.emit('Booking_Error',{
                "data":String(e)
            });
        }
    })
}

module.exports = {
    busData,
    bookTicket
};