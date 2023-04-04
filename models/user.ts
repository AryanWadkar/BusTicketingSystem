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
  rollno:{
    type:String
  },
  logintime:{
    type:Date,
    default:Date.now(),
    required:true
  },
  regstatus:{
    type:Boolean,
    required:true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model("user", UserSchema);