import mongoose from 'mongoose';


const QueueItem = new mongoose.Schema({
  txnid: {
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
  q: {
    type: [{
      type: mongoose.Schema.Types.Mixed
    }]
  },
  booking:{
    type:Map,
    default:{}
  }
});

//TODO: Give better names to fields here
module.exports = mongoose.model("Queue", QueueItem);