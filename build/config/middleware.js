"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_json_validator_middleware_1 = require("express-json-validator-middleware");
function validationErrorMiddleware(error, request, response, next) {
    if (response.headersSent) {
        return next(error);
    }
    const isValidationError = error instanceof express_json_validator_middleware_1.ValidationError;
    if (!isValidationError) {
        return next(error);
    }
    response.status(400).json({
        "status": false,
        "message": "Improper request!",
        "data": error.validationErrors,
    });
    next();
}
module.exports = {
    validationErrorMiddleware
};
//# sourceMappingURL=middleware.js.map