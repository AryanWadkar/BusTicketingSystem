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
  },
  txnid:{
    type:String,
  },
});

module.exports = mongoose.model("Ticket", Ticket);