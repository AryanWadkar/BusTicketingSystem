"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Ticket = new mongoose_1.default.Schema({
    source: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    user_email: {
        type: String,
        required: true
    },
    txnid: {
        type: Number,
        required: true
    },
});
module.exports = mongoose_1.default.model("busMaster", Ticket);
//# sourceMappingURL=ticket.js.map