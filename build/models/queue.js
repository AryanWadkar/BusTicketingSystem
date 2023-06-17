"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const QueueItem = new mongoose_1.default.Schema({
    txnid: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        required: true
    },
    initTime: {
        type: Date,
        default: Date.now()
    },
    q: {
        type: [{
                type: mongoose_1.default.Schema.Types.Mixed
            }]
    },
    booking: {
        type: Map,
        default: {}
    }
});
//TODO: Give better names to fields here
module.exports = mongoose_1.default.model("Queue", QueueItem);
//# sourceMappingURL=queue.js.map