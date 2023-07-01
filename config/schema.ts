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

const addBusSchema: AllowedSchema  = {
  type: "object",
  required: ["hrs","mins","src",'dest','capacity'],
  properties: {
      hrs: {
      type: "number",
    },
      mins:{
      type: "number",
    },
    src:{
      type: "string",
    },  
    dest: {
      type: "string",
    },
    capacity: {
      type: "number",
    },
  },
};

const busIdReqSchema: AllowedSchema  = {
  type: "object",
  required: ["busId"],
  properties: {
    busId: {
      type: "string",
      minLength:12
    }
  },
};

const OTRSchema: AllowedSchema  = {
  type: "object",
  required: ["email","pass","access","magicword","name"],
  properties: {
    email: {
      type: "string",
    },
    pass: {
      type: "string",
    },
    access: {
      type: "string",
    },
    magicword: {
      type: "string",
    },
    name: {
      type: "string",
    },
  },
};

const revokeSchema: AllowedSchema  = {
  type: "object",
  required: ["email","access","magicword"],
  properties: {
    email: {
      type: "string",
    },
    access: {
      type: "string",
    },
    magicword: {
      type: "string",
    }
  },
};

module.exports={
    usernameSchema,
    username_opt_Schema,
    registrationSchema,
    loginSchema,
    resetPassSchema,
    addBusSchema,
    busIdReqSchema,
    OTRSchema,
    revokeSchema
}