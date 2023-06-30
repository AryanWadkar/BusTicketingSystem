import { ValidateFunction } from "express-json-validator-middleware";

const Ajv = require('ajv');
const ajv = new Ajv();

const ticketReqSchema = {
  type: 'object',
  properties: {
    source: {
      type: 'string',
      minLength: 1,
    },
    destination: {
        type: 'string',
        minLength: 1,
    },
    startTime: {
        type: "string",
        pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}Z$"
    },
  },
  required: ['source','destination','startTime'],
};

const busIdReqSchema = {
    type: 'object',
    properties: {
        busId: {
        type: 'string',
        minLength: 12,
      },
    },
    required: ['busId'],
};

const queueReqSchema = {
    type: "object",
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
    "required": ["preferences"]
};

const scanQRSchema = {
    type: "object",
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
    },
    required: ["code", "email", "ticketBusId", "sessionBusId"]
};

const pageReqSchema = {
  type: 'object',
  properties: {
      page: {
      type: 'number',
      "minimum": 1,
    },
  },
  required: ['page'],
};

const validateTicketReq:ValidateFunction = ajv.compile(ticketReqSchema);
const validatebusIdReq:ValidateFunction = ajv.compile(busIdReqSchema);
const validateQueueReq:ValidateFunction = ajv.compile(queueReqSchema);
const validateScanQRReq:ValidateFunction = ajv.compile(scanQRSchema);
const validatePageReq:ValidateFunction = ajv.compile(pageReqSchema);

module.exports={validatebusIdReq,validateTicketReq,validateQueueReq,validateScanQRReq,validatePageReq};