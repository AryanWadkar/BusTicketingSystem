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
  stops:{
    type:String, //insti-fresh-sadar etc 
    required:true
  },
  days:{
    type:[String],
    required:true
  }
});

module.exports = mongoose.model("bus", Bus);