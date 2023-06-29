const UserModel = require("../models/user");
const userservice = require('../services/userservices');
const BusModel = require("../models/bus");
const TransactionModel = require("../models/transaction");
const TicketModel = require('../models/ticket');
import * as nodemailer from 'nodemailer';
import * as mongoose from 'mongoose';

async function bookTicket(email:String,ticketsrc:String,ticketdest:String,tickettime:Date,err:Function,next:Function):Promise<void>{
    const session = await mongoose.startSession();
            session.startTransaction();
            const user = await UserModel.findOne({
                email:email
            });
            const walletenc = user.wallet;
            const busExists = await BusModel.findOne({
                source:ticketsrc,
                destination:ticketdest,
                startTime:tickettime,
                capacity:{$gt:0},
                sessionStart:false
            });
            if(!busExists){
                err("No tickets found!");
            }else{
                const ticketex = await TicketModel.find({
                    email:email,
                    source:ticketsrc,
                    destination:ticketdest,
                    startTime:tickettime,
                });
                if(ticketex.length>0)
                {
                    err("Already Booked!");
                }else{
                    const ticket = await TicketModel.findOne(
                        {
                          source:ticketsrc,
                          destination:ticketdest,
                          startTime:tickettime,
                          email: { $eq: "" },
                          txnId:{ $eq: "" }
                        }
                      ).session(session); 
                    if(!ticket)
                    {
                        err("No tickets found!");
                    }else{
                        try
                        {
                            let amt = userservice.decryptAmount(walletenc);
                            const ticketcost= parseInt(process.env.TICKET_AMT || "", 20);
                            if(amt<ticketcost)
                            {
                                err("Insufficient balance!");
                            }else{
    
                                amt=amt-ticketcost;
                                const encamt = userservice.encryptAmount(amt);
                                await UserModel.updateOne(
                                    { email: email },
                                    { $set: { wallet: encamt } },
                                    { session }
                                ).session(session);
    
    
                                const transaction = new TransactionModel({
                                amount: ticketcost,
                                email: email,
                                date: new Date(),
                                type: '-'
                                });
                                
    
                                const newtransaction= await transaction.save({session});
                                await TicketModel.updateOne(
                                    { _id: ticket._id },
                                    { $set: { txnId: newtransaction._id,email:email } },
                                    { session }
                                ).session(session);
    
                                await BusModel.updateOne(
                                    {
                                        source:ticketsrc,
                                        destination:ticketdest,
                                        startTime:tickettime,
                                    },
                                    { $inc: { capacity: -1 } },
                                    { session }
                                ).session(session);
                                await session.commitTransaction();
                                next({
                                    "source":ticketsrc,
                                    "destination":ticketdest,
                                    "startTime":tickettime,
                                    "ticketId": ticket._id,
                                    "txnId": newtransaction._id
                                });
    
                            }
                            }catch(e){
                                await session.abortTransaction();
                                err(String(e));
                            }finally {
                                session.endSession();
                            }
                    }
                }
            }
}

async function sendQueueMail(tosend:String,processresult:object,orignalrequestdata:object){

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_MAIL,
          pass:process.env.SMTP_APP_PASS
        }
   });

   let mailbody=``;
   switch(processresult['message'])
   {
    case "Insufficient balance!":mailbody=`<p>We regret to inform you that your ticket booking request was not fulfilled due to the following reason:</p>
    <p><strong>Insufficient balance in your BUTS wallet</strong></p>`;
    break;
    case "No tickets found!":mailbody=`<p>We regret to inform you that your ticket booking request was not fulfilled due to the following reason:</p>
    <p><strong>All tickets in your preference list were found to be exhausted</strong></p>`;
    break;
    case "Already Booked!":mailbody=`<p>We regret to inform you that your ticket booking request was not fulfilled due to the following reason:</p>
    <p><strong>The system detected a prexisting booking in your name</strong></p>`;
    break;
    case "No Match at end":mailbody=`<p>We regret to inform you that your ticket booking request was not fulfilled due to the following reason:</p>
    <p><strong>All tickets in your preference list were found to be exhausted</strong></p>`;
    break;
    case "Success":mailbody=`    
    <p>Your booking request has been executed successfully, the ticket allotted to you based on your preference list and subject to availability is:</p>
    <table style="width: 100%;">
        <tbody>
            <tr>
                <td style="width: 31.723%;">
                    <div style="text-align: center;">Source</div>
                </td>
                <td style="width: 33.3333%;">
                    <div style="text-align: center;">Destination</div>
                </td>
                <td style="width: 34.7385%;">
                    <div style="text-align: center;">Time</div>
                </td>
            </tr>
            <tr>
                <td style="width: 31.723%;"><div data-empty="true" style="text-align: center;">${processresult['source']}</div></td>
                <td style="width: 33.3333%;"><div data-empty="true" style="text-align: center;">${processresult['destination']}</div></td>
                <td style="width: 34.7385%;"><div data-empty="true" style="text-align: center;">${getLegibleTime(processresult['startTime'])}</div></td>
            </tr>
        </tbody>
    </table>
    <p>The details of the booked ticket are as follows:</p>
    <p><strong>Transaction ID:</strong> ${processresult['txnId']}</p>
    <p><strong>Ticket ID:</strong> ${processresult['ticketId']}</p>
    <p>Happy Travelling!</p>
    `;
    break;
    default:mailbody=`<p>We regret to inform you that your ticket booking request was not fulfilled due to the following reason:</p>
    <p><strong>${processresult['message']}</strong></p>`;
   }

   const madeat=getLegibleDate(orignalrequestdata['madeat']);
   const preferences=orignalrequestdata['preferences'];
   let tabledata=``;
   let i:number=0;
   let n:number=preferences.length;
   while(i<n)
   {
       let src=preferences[i]['source'];
       let dest=preferences[i]['destination'];
       let time=getLegibleTime(preferences[i]['startTime']);
       tabledata+=`
       <tr>
       <td style="width: 33.2308%;;width: 25.0000%">
           <div data-empty="true" style="text-align: center;">${i+1}</div>
       </td>
       <td style="width: 24.9231%;">
           <div data-empty="true" style="text-align: center;">${src}</div>
       </td>
       <td style="width: 25.0385%;">
           <div data-empty="true" style="text-align: center;">${dest}</div>
       </td>
       <td style="width: 24.9231%;">
           <div data-empty="true" style="text-align: center;">${time}</div>
       </td>
   </tr>
   
   `;
       i++;
   }

   const headertext=`<p>Hello,</p>
   <p>This mail is in regards to the ticket booking queue request made on : ${madeat}, with the following preference list:</p>
   <table style="width: 100%;">
       <tbody>
           <tr>
               <td style="width: 33.2308%;;width: 25.0000%">
                   <div style="text-align: center;">S.No</div>
               </td>
               <td style="width: 24.9231%; text-align: center;">
                   <div style="text-align: center;">Source</div>
               </td>
               <td style="width: 25.0385%;">
                   <div style="text-align: center;">Destination</div>
               </td>
               <td style="width: 24.9231%;">
                   <div style="text-align: center;">Time</div>
               </td>
           </tr>
            ${tabledata}
       </tbody>
   </table>`;
    let mailOptions={
        from: process.env.SMTP_MAIL,
        to: tosend,
        subject: 'Queue Booking Result',
        html: `${headertext}${mailbody}<p>Regards,</p>
        <p>Team BUTS.</p>`
      };
        
    transporter.sendMail(mailOptions, function(err, data) {});
}

async function sendTicketMail(tosend:String,processresult:object,orignalrequestdata:object){
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_MAIL,
          pass:process.env.SMTP_APP_PASS
        }
   });

   let mailbody=``;
   switch(processresult['message'])
   {
    case "Insufficient balance!":mailbody=`<p>We regret to inform you that your ticket booking request was not fulfilled due to the following reason:</p>
    <p><strong>Insufficient balance in your BUTS wallet</strong></p>`;
    break;
    case "No tickets found!":mailbody=`<p>We regret to inform you that your ticket booking request was not fulfilled due to the following reason:</p>
    <p><strong>All tickets in your requested bus were found to be exhausted</strong></p>`;
    break;
    case "Already Booked!":mailbody=`<p>We regret to inform you that your ticket booking request was not fulfilled due to the following reason:</p>
    <p><strong>The system detected a prexisting booking in your name in the same bus, you are allowed to book only 1 seat per bus.</strong></p>`;
    break;
    case "Success":mailbody=`    
    <p>Your booking request has been successfully executed, the ticket details are as follows:.</p>
    <p><strong>Transaction ID:</strong> ${processresult['txnId']}</p>
    <p><strong>Ticket ID:</strong> ${processresult['ticketId']}</p>
    <p>Happy travelling.</p>
    `;
    break;
    default:mailbody=`<p>We regret to inform you that your ticket booking request was not fulfilled due to the following reason:</p>
    <p><strong>${processresult['message']}</strong></p>`;
   }

   const headertext=`<p>Hello,</p>
   <p>This mail is in regards to the ticket booking request made by you on : ${getLegibleDate(orignalrequestdata['reqtime'])}, for the following bus:</p>
   <table style="width: 100%;">
       <tbody>
           <tr>
               <td style="width: 33.3333%;">
                   <div style="text-align: center;">Source</div>
               </td>
               <td style="width: 33.3333%;">
                   <div style="text-align: center;">Destination</div>
               </td>
               <td style="width: 33.3333%;">
                   <div style="text-align: center;">Time</div>
               </td>
           </tr>
           <tr>
               <td style="width: 33.3333%;"><div style="text-align: center;">${orignalrequestdata['source']}</div></td>
               <td style="width: 33.3333%;"><div style="text-align: center;">${orignalrequestdata['dest']}</div></td>
               <td style="width: 33.3333%;"><div style="text-align: center;">${getLegibleTime(orignalrequestdata['time'])}</div></td>
           </tr>
       </tbody>
   </table>`;
    let mailOptions={
        from: process.env.SMTP_MAIL,
        to: tosend,
        subject: 'Ticket Booking Result',
        html: `${headertext}${mailbody}<p>Regards,</p>
        <p>Team BUTS.</p>`
      };
        
    transporter.sendMail(mailOptions, function(err, data) {});
}

function getLegibleTime(datestr:string):string{
    const date= new Date(datestr);
    const finaldate:string=date.toLocaleTimeString('en-US', { hour12: true });
    return finaldate;
}

function getLegibleDate(datestr:string):string{
    const date= new Date(datestr);
    const finaldate:string=date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
      });
    return finaldate;
}

module.exports={bookTicket,sendQueueMail,sendTicketMail};