import { AllowedSchema } from "express-json-validator-middleware";

const usernameSchema: AllowedSchema  = {
  type: "object",
  required: ["username"],
  properties: {
    username: {
      type: "string",
    }
  },
};

const username_opt_Schema: AllowedSchema  = {
    type: "object",
    required: ["username","otp"],
    properties: {
      username: {
        type: "string",
      },
      otp:{
        type:"string"
      }
    },
};

  const registrationSchema: AllowedSchema  = {
    type: "object",
    required: ["name","password","rollNo"],
    properties: {
      username: {
        type: "string",
      },
      password:{
        type: "string",
        minLength:6
      },
      rollno:{
        type: "string",
      }
    },
};

const loginSchema: AllowedSchema  = {
    type: "object",
    required: ["email","password"],
    properties: {
      email: {
        type: "string",
      },
      password:{
        type: "string",
        minLength:6
      },
    },
};

const resetPassSchema: AllowedSchema  = {
    type: "object",
    required: ["newpass"],
    properties: {
        newpass: {
        type: "string",
        minLength:6
      },
    },
};

module.exports={
    usernameSchema,
    username_opt_Schema,
    registrationSchema,
    loginSchema,
    resetPassSchema
}