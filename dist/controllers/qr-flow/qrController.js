"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTypesOfQRBasedOnDelivery = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const newQRTypeModel_1 = require("../../models/qr-flow/newQRTypeModel");
const ApiResponse_1 = require("../../config/ApiResponse");
exports.fetchTypesOfQRBasedOnDelivery = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { deliveryType } = req.body;
    if (!deliveryType) {
        return (0, ApiResponse_1.ApiResponse)(res, 400, 'deliveryType is required', false, null);
    }
    const qrTypes = yield newQRTypeModel_1.QRMetaData.find({
        deliveryType: { $in: [deliveryType] },
    }).select('_id qrName qrDescription qrUseCases productImage originalPrice discountedPrice includeGST stockCount deliveryType');
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'QR Types fetched successfully', true, qrTypes);
}));
