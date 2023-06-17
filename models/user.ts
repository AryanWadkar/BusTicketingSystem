import mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
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
  },
  loginTime:{
    type:Date,
    default:Date.now()
  }
});

export default mongoose.model("user", UserSchema);