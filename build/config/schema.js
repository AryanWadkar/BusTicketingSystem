"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const usernameSchema = {
    type: "object",
    required: ["username"],
    properties: {
        username: {
            type: "string",
        }
    },
};
const username_opt_Schema = {
    type: "object",
    required: ["username", "otp"],
    properties: {
        username: {
            type: "string",
        },
        otp: {
            type: "string"
        }
    },
};
const registrationSchema = {
    type: "object",
    required: ["name", "password", "rollno"],
    properties: {
        username: {
            type: "string",
        },
        password: {
            type: "string",
            minLength: 6
        },
        rollno: {
            type: "string",
        }
    },
};
const loginSchema = {
    type: "object",
    required: ["name", "password"],
    properties: {
        username: {
            type: "string",
        },
        password: {
            type: "string",
            minLength: 6
        },
    },
};
const resetPassSchema = {
    type: "object",
    required: ["newpass"],
    properties: {
        newpass: {
            type: "string",
            minLength: 6
        },
    },
};
module.exports = {
    usernameSchema,
    username_opt_Schema,
    registrationSchema,
    loginSchema,
    resetPassSchema
};
//# sourceMappingURL=schema.js.map