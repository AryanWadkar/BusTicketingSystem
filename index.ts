//Init imports
import * as express from 'express';
const cors = require("cors");
import { Server } from "socket.io";
const app = express();


// local imports
const InitMongoServer = require("./config/db");
const middleWare = require("./config/middleware");

const userrest = require("./routes/userapisrest");
const dev = require('./routes/dev');
const conductorrest = require('./routes/conductorapisrest');
const godadmin = require('./routes/godadmin');

// const globalservices = require('./services/globalservices');
// const usersocket = require('./routes/userapissocket');
// const conductorsocket=require('./routes/conductorapissocket');

const scheduler = require('./services/schedulerservices');
import redis from "./config/redis";

//Initialization and vars
InitMongoServer();

redis.InitRedisServer();

scheduler;

var corsOptions = {
    origin: "http://localhost:8081"
};

const PORT = process.env.PORT || 8080;

// Server methods
app.use(cors(corsOptions));
  
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Sever is now functional!" });
});

app.use("/user", userrest);

app.use("/dev", dev);

app.use("/conductor", conductorrest);

app.use("/godadmin", godadmin);

app.use(middleWare.validationErrorMiddleware);

const server = app.listen(PORT, () => {

console.log(`Server is running on port ${PORT}`);
});

// const io = new Server(server, { /* options */ });

// io.use(globalservices.jwtVerifySocket).on("connection", (socket)=>{
//     socket.on('get/bus',(messageData)=>usersocket.busData(socket,io));
//     socket.on('post/book',(messageData)=>usersocket.bookTicket(socket,messageData));
//     socket.on('post/queue',(messageData)=>usersocket.joinQueue(socket,messageData));
//     socket.on('get/bookings',(messageData)=>usersocket.getBookings(socket));
//     socket.on('get/wallet',(messageData)=>usersocket.getWallet(socket,messageData));
//     socket.on('get/queue',(messageData)=>usersocket.getQueueEntry(socket));
//     socket.on('get/QR',(messageData)=>usersocket.getQR(socket,messageData));
    
//     socket.on('get/busStatic',(messageData)=>conductorsocket.busDataConductor(socket));
//     socket.on('post/startSession',(messageData)=>conductorsocket.busSessionStart(socket,messageData));
//     socket.on('post/scanQR',(messageData)=>conductorsocket.busScanQR(socket,messageData));
// });
