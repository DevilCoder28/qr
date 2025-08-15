"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoute = void 0;
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const jwtAuthenticationMiddleware_1 = require("../middlewares/jwtAuthenticationMiddleware");
const enums_1 = require("../enums/enums");
const userController_2 = require("../controllers/userController");
exports.userRoute = express_1.default.Router();
exports.userRoute.get('/', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([enums_1.UserRoles.BASIC_USER]), userController_1.userProfile);
exports.userRoute.post('/register-device', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([enums_1.UserRoles.BASIC_USER]), userController_2.registerDeviceToken);
exports.userRoute.post('/unregister-device', jwtAuthenticationMiddleware_1.authenticate, (0, jwtAuthenticationMiddleware_1.authorize)([enums_1.UserRoles.BASIC_USER]), userController_2.unregisterDeviceToken);
