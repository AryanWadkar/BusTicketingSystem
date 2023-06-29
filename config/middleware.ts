
import {ValidateFunction, ValidationError } from "express-json-validator-middleware";
import { Socket } from "socket.io";


function validationErrorMiddleware(error, request, response, next) {
	if (response.headersSent) {
		return next(error);
	}

	const isValidationError = error instanceof ValidationError;
	if (!isValidationError) {
		return next(error);
	}

	response.status(400).json({
        "status":false,
        "message":"Improper request!",
		"data": error.validationErrors,
	});

	next();
}

function socketValidationMiddleware(socket:Socket,datain:Object,validationfn,Event:string):boolean{

	const isValid=validationfn(datain);
	if(isValid){
		return true;
	}else{
		socket.emit(Event,{"data":validationfn.errors});
		return false;
	}
}

module.exports={
    validationErrorMiddleware,
	socketValidationMiddleware
};