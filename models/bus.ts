import mongoose from 'mongoose';


const Bus = new mongoose.Schema({
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
  capacity:{
    type:Number,
    required:true
  },
  initialCapacity:{
    type:Number,
    required:true
  },
  stops:{
    type:[String],
    required:true
  },
  days:{
    type:[String],
    required:true
  },
  sessionStart:{
    type:Boolean,
    required:true,
    default:false
  }
});

module.exports = mongoose.model("bus", Bus);