"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
const ApiResponse = (res, statusCode, message, success, data, error) => {
    return res.status(statusCode).json({
        MESSAGE: message,
        SUCCESS: success,
        ERROR: error !== null && error !== void 0 ? error : null,
        DATA: data !== null && data !== void 0 ? data : null,
    });
};
exports.ApiResponse = ApiResponse;
