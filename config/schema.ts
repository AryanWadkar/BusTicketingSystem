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

const ticketReqSchema: AllowedSchema = {
  type: "object",
  required: ["source","destination","startTime"],
  properties: {
    source: {
      type: "string",
      minLength: 1,
    },
    destination: {
        type: "string",
        minLength: 1,
    },
    startTime: {
        type: "string",
        pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}Z$"
    },
  },
};

const queueReqSchema: AllowedSchema = {
    type: "object",
    required: ["preferences"],
    properties: {
      preferences: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            source: {
              type: "string",
              minLength: 1,
            },
            destination: {
              type: "string",
              minLength: 1,
            },
            startTime: {
              type: "string",
              pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}Z$"
            }
          },
          "required": ["source", "destination", "startTime"]
        },
      }
    },
};

const scanQRSchema: AllowedSchema = {
    type: "object",
    required: ["code", "email", "ticketBusId", "sessionBusId"],
    properties: {
      "code": {
        type: "number",
        "minimum": 100000,
        "maximum": 999999
      },
      email: {
        "type": "string",
        "minLength": 1
      },
      ticketBusId: {
        "type": "string",
        "minLength": 12
      },
      sessionBusId: {
        "type": "string",
        "minLength": 12
      }
    }
};

const pageReqSchema: AllowedSchema = {
  type: 'object',
  required: ['page'],
  properties: {
      page: {
      type: 'number',
      "minimum": 1,
    },
  }
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
    revokeSchema,
    ticketReqSchema,
    queueReqSchema,
    scanQRSchema,
    pageReqSchema
}