import * as express from 'express';
import { Response,Request } from 'express';
const globalservice = require('../services/global_services');

 function busData(socket){
    socket.on('get/bus',async (data)=>{
        await globalservice.verifySocket(socket,()=>{},false);
        socket.emit('Bus_data',{
            'test':'data'
        });
    });

}


module.exports = {
    busData
};