require('dotenv').config();
const BusModel = require("../models/bus");
const QueueModel = require("../models/queue");
import * as globalService from'../services/globalservices';
import * as BusService from '../services/busservices';

function busData(socket,io){
    // socket.on('get/busold',async (data)=>{
    //     //await globalservice.verifySocket(socket,()=>{},false); restore later
    //     const tickets = await TicketModel.find();
    //     const buses = tickets.reduce((acc, ticket) => {
    //         if (ticket.email === '') {
    //           const existingBus = acc.find(bus => 
    //             bus.time.getHours()===ticket.startTime.getHours() && bus.time.getMinutes()===ticket.startTime.getMinutes());
    //           if (existingBus) {
    //             existingBus.count++;
    //           } else {
    //             acc.push({ time:ticket.startTime, count: 1,src:ticket.source,dest:ticket.destination });
    //           }
    //         }
    //         return acc;
    //       }, []);
    //     socket.emit('Bus_data',{
    //         'data':buses
    //     });
    //     const filter = { operationType: 'insert' };
    //     const changeStream = TicketModel.watch({fullDocument: 'updateLookup' });
    //     changeStream.on('change', (change) => {
    //         //console.log('Change:', change.fullDocument);
    //         const ticket = change.fullDocument;
    //         try{
    //             const bus = buses.find(bus=>bus.time.getHours()===ticket.startTime.getHours() && bus.time.getMinutes()===ticket.startTime.getMinutes());
    //             if(bus)
    //             {
    //                 if(ticket.email==="" && ticket.txnid==="")
    //                 {
    //                     bus.count++;
    //                 }else{
    //                     bus.count--;
    //                 }
    //             }else{
    //                 buses.push({ time:ticket.startTime, count: 1,src:ticket.source,dest:ticket.destination });
    //             }
    //             //add jwt verification again
    //             io.emit('Bus_data',{
    //                 'data':buses
    //             });
    //         }catch(err)
    //         {
    //             console.log("BUS UPDATE ERROR",err);
    //         }

    //       });
    // });

    socket.on('get/bus',async (datain)=>{
        const thisnext=async(data)=>{
            const buses = await BusModel.find();
            socket.emit('Bus_Success',{
                'data':buses
            });
            const filter = { operationType: 'insert' };
            const changeStream = BusModel.watch({fullDocument: 'updateLookup' });
            changeStream.on('change', async(change) => {
                //console.log('Change:', change.fullDocument);
                const updatedbus = change.fullDocument;
                try{
                    const newnext = async(data)=>{  
                        //console.log(updatedbus);                  
                        let index = buses.findIndex(function (bus,i) {
                            return String(bus._id)===String(updatedbus._id)});
                        if(index!==-1)
                        {
                            buses[index]=updatedbus;
 
                        }
                        io.emit('Bus_Success',{
                            'data':buses
                        });
                    };
                    await globalService.authenticateOps(socket,newnext,'Bus_Error','get/bus');
    
                }catch(err)
                {
                    console.log("BUS UPDATE ERROR",err);
                    socket.emit('Bus_Error',{
                        'data':String(err)
                    });
                }
    
              });
        };
        await globalService.authenticateOps(socket,thisnext,'Bus_Error','get/bus')
        
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

function bookTicket(socket,io){
    socket.on('post/book',async(datain)=>{
        const thisnext=async(data)=>{

            const email = data['email'];
            let src=datain['source'];
            let dest=datain['destination'];
            let time=datain['startTime'];
            const reqtime=new Date(Date.now()).toISOString();
            const bookingreqdetail={'reqtime':reqtime,'source':src,'dest':dest,'time':time};
            async function bookingsuccess(bookingdata:{}){
                socket.emit('Booking_Success',{
                    "data":bookingdata
                });
                BusService.sendTicketMail(email,'Success',bookingreqdetail);
            }

            function bookingfaliure(errormessage:String){
                socket.emit('Booking_Error',{
                    "data":errormessage
                });
                BusService.sendTicketMail(email,errormessage,bookingreqdetail);
            }

            await BusService.bookTicket(email,src,dest,time,bookingfaliure,bookingsuccess);
        };
        await globalService.authenticateOps(socket,thisnext,'Booking_Error','post/book');
    })
}

function joinQueue(socket,io){
    socket.on('post/queue',async(datain)=>{
        const thisnext=async(data)=>{
            const email=data['email'];
            const requestedorder = datain['q'];
            const queueobjs=await QueueModel.find({
                email:email
            });
            if(queueobjs.length>0)
            {
                socket.emit('Queue_Error',{
                    "data":"Already in queue!"
                });
            }else{
                const newQueueobj = QueueModel({
                    email:email,
                    q:requestedorder,
                    initTime:Date.now()
                });
                await newQueueobj.save().then((data)=>{
                    socket.emit('Queue_Success',{
                        "data":"Added to queue successfully",
                        "qid":data
                    });
                }).catch((e)=>{
                    socket.emit('Queue_Error',{
                        "data":"Error adding to queue",
                        "message":String(e)
                    });
                });
            }
        };
        await globalService.authenticateOps(socket,thisnext,'Queue_Error','post/queue');
    })
}

module.exports = {
    busData,
    bookTicket,
    joinQueue
};