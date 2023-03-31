"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const OTPSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    expiresAt: {
        type: Date,
        default: Date.now() + 3600000
    }
});
module.exports = mongoose_1.default.model("otp", OTPSchema);
//# sourceMappingURL=otp.js.map