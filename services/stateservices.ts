
let overRideState:boolean=false;

function correctState():string{
    const currdatetime= new Date();
    const hours=currdatetime.getHours();
    const minutes = currdatetime.getMinutes();
    let res="";
    if (hours >= 10 && hours < 13) {
        res= "Queueing";
      } else if (hours === 13 && minutes >= 0 && minutes < 30) {
        res= "Processing";
      } else if (hours >= 13 && hours < 22) {
        res= "Ticketing";
      } else {
        res= "Waiting";
      }
      console.log("state set to :"+res);
      return res;
}

function toggleState():boolean{
    overRideState=!overRideState;
    console.log("Override set to : "+overRideState);
    return overRideState;
}

function getoverRideState(){
  return overRideState;
}

module.exports={
    getoverRideState,
    correctState,
    toggleState
}