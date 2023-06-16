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
const bus = require('./routes/busapis');
const dev = require('./routes/dev');
const usersocket = require('./routes/userapissocket');
const scheduler = require('./schedulers/clearscheduler');


//Initialization and vars
InitMongoServer();

scheduler.clearticket();

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

app.use(middleWare.validationErrorMiddleware);

const server = app.listen(PORT, () => {

console.log(`Server is running on port ${PORT}`);
});

const io = new Server(server, { /* options */ });

io.use(globalservices.jwtVerifySocket).on("connection", (socket)=>{
  bus.busData(socket,io);
  bus.bookTicket(socket,io);
  bus.joinQueue(socket,io);
  usersocket.getWallet(socket,io);
  usersocket.getBookings(socket,io);
});

module.exports=app;