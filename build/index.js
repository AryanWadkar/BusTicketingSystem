"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cors = require("cors");
const InitMongoServer = require("./config/db");
const app = express();
const user = require("./routes/userapis");
InitMongoServer();
var corsOptions = {
    origin: "http://localhost:8081"
};
app.use(cors(corsOptions));
app.use(express.json());
app.get("/", (req, res) => {
    res.json({ message: "Buts server functional!" });
});
app.use("/user", user);
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map