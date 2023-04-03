
import {ValidationError } from "express-json-validator-middleware";

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

module.exports={
    validationErrorMiddleware
};