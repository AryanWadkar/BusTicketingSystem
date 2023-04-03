"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Bus = new mongoose_1.default.Schema({
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
    capacity: {
        type: Number,
        required: true
    },
    stops: {
        type: String,
        required: true
    },
    days: {
        type: [String],
        required: true
    }
});
module.exports = mongoose_1.default.model("busMaster", Bus);
//# sourceMappingURL=bus.js.map