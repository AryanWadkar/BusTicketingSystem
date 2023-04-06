import mongoose from 'mongoose';


const Transaction = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  user_email: {
    type: String,
    required: true
  },
  date:{
    type:Date,
    required:true
  },
  type:{
    type:String,
    required:true
  }
});

module.exports = mongoose.model("Transaction", Transaction);