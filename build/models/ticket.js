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
    email: {
        type: String,
    },
    txnid: {
        type: String,
    },
});
module.exports = mongoose_1.default.model("Ticket", Ticket);
//# sourceMappingURL=ticket.js.map