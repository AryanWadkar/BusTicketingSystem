"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Transaction = new mongoose_1.default.Schema({
    amount: {
        type: Number,
        required: true
    },
    user_email: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
});
module.exports = mongoose_1.default.model("busMaster", Transaction);
//# sourceMappingURL=transaction.js.map