import * as nodemailer from 'nodemailer';
let overRideState:boolean=false;

function correctState():string{
  return "Ticketing";
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

function suspendOperations(err){
  overRideState=true;
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_MAIL,
      pass:process.env.SMTP_APP_PASS
    }
});

let mailOptions = {
        from: process.env.SMTP_MAIL,
        to: process.env.EMERGENCY_MAIL,
        subject: 'Fatal flaw error',
        html: `<p>There has been a fatal error on the BUTS server and it requires your attention</p>
        <p>The server operation has been suspended due to the following reason</p>
        <p>${String(err)}</p>
        <p><strong>Team BUTS</strong>.</p>`
  };

  try{
    transporter.sendMail(mailOptions, async function(err, data) {
        if (err) {
          console.log("Error " + err);
        }
      });
  }catch(err){
    console.log("Error saving" + err);
  }
}

module.exports={
    getoverRideState,
    correctState,
    toggleState,
    suspendOperations
}