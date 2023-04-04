//Init imports
import * as express from 'express';
const cors = require("cors");
import { Server } from "socket.io";
const app = express();


// local imports
const InitMongoServer = require("./config/db");
const middleWare = require("./config/middleware");
const user = require("./routes/userapis");
const globalservices = require('./services/global_services');
const bus = require('./routes/busapis');
//Initialization and vars
InitMongoServer();

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

app.use("/user", user);

app.use(middleWare.validationErrorMiddleware);

const server = app.listen(PORT, () => {

console.log(`Server is running on port ${PORT}`);
});

const io = new Server(server, { /* options */ });



io.use(globalservices.verifySocket).on("connection", (socket)=>{
  bus.busData(socket);
});