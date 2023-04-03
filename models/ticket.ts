import mongoose from 'mongoose';


const Ticket = new mongoose.Schema({
  source: {
    type: String,
    required: true
   },
  destination: {
    type: String,
    required: true
  },
  startTime:{
    type:Date,
    required:true
  },
  user_email: {
    type: String,
    required: true
  },
  txnid:{
    type:Number,
    required:true
  },
});

module.exports = mongoose.model("busMaster", Ticket);