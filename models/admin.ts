export {};
const mongoose = require("mongoose");

const AdminSchema = mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  access:{
    type: String,
    required: true
  }
});

module.exports = mongoose.model("admin", AdminSchema);