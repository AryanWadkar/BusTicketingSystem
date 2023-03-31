import mongoose from 'mongoose';


const OTPSchema = new mongoose.Schema({
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
  expiresAt:{
    type: Date,
    default: Date.now() + 3600000
  }
});

module.exports = mongoose.model("otp", OTPSchema);