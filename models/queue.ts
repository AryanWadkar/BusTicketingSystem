import mongoose from 'mongoose';


const QueueItem = new mongoose.Schema({
  txnId: {
    type: String,
    default:""
   },
  email: {
    type: String,
    required: true
  },
  initTime:{
    type:Date,
    default:Date.now()
  },
  preferences: {
    type: [{
      type: mongoose.Schema.Types.Mixed
    }]
  },
  booking:{
    type:Map,
    default:{}
  }
});

module.exports = mongoose.model("Queue", QueueItem);