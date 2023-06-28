const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String
  },
  rollNo:{
    type:String
  },
  regStatus:{
    type:Boolean,
    required:true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  wallet:{
    type:String,
    default:""
  }
});

module.exports = mongoose.model("user", UserSchema);