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
  email: {
    type: String,
  },
  txnId:{
    type:String,
  },
  busId:{
    type:mongoose.Types.ObjectId,
    required:true
  },
  verified:{
    type:Boolean,
    default:false
  }
});

module.exports = mongoose.model("Ticket", Ticket);