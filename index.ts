//Init imports
import * as express from 'express';
const cors = require("cors");
import { Server } from "socket.io";
const app = express();


// local imports
const InitMongoServer = require("./config/db");
const middleWare = require("./config/middleware");
const userrest = require("./routes/userapisrest");
const globalservices = require('./services/globalservices');
const dev = require('./routes/dev');
const conductor = require('./routes/conductorapisrest');
const usersocket = require('./routes/userapissocket');
const conductorsocket=require('./routes/conductorapissocket');
//const scheduler = require('./schedulers/clearscheduler');
import redis from "./config/redis";

//Initialization and vars
InitMongoServer();

redis.InitRedisServer();

//scheduler.clearticket();

var corsOptions = {
    origin: "http://localhost:8081"
};

const PORT = process.env.PORT || 8080;

// Server methods
app.use(cors(corsOptions));
  
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Buts server functional!" });
});

app.use("/user", userrest);

app.use("/dev", dev);

app.use("/conductor", conductor);

app.use(middleWare.validationErrorMiddleware);

const server = app.listen(PORT, () => {

console.log(`Server is running on port ${PORT}`);
});

const io = new Server(server, { /* options */ });

io.use(globalservices.jwtVerifySocket).on("connection", (socket)=>{
  usersocket.busData(socket,io);
  usersocket.bookTicket(socket);
  usersocket.joinQueue(socket);
  usersocket.getWallet(socket);
  usersocket.getBookings(socket);
  usersocket.getQueueEntry(socket);
  usersocket.getQR(socket);
  conductorsocket.busDataConductor(socket);
  conductorsocket.busSession(socket);
});

module.exports=app;