"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoute = void 0;
const express_1 = __importDefault(require("express"));
const jwtAuthenticationMiddleware_1 = require("../../../middlewares/jwtAuthenticationMiddleware");
const enums_1 = require("../../../enums/enums");
const paymentController_1 = require("../../../controllers/payment/paymentController");
exports.paymentRoute = express_1.default.Router();
exports.paymentRoute.post('/initiate', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([enums_1.UserRoles.BASIC_USER]), paymentController_1.initiatePayment);
exports.paymentRoute.get('/verify-payment', 
// authenticate,
// authorize([UserRoles.BASIC_USER]),
paymentController_1.paymentCallBackHandler);
exports.paymentRoute.get('/payment-status', 
// authenticate,
// authorize([UserRoles.BASIC_USER]),
paymentController_1.paymentStatusHandler);
