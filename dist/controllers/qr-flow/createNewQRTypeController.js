"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.createAndSaveQR = exports.createNewQRType = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const newQRTypeSchema_1 = require("../../validators/qr-flow/newQRTypeSchema");
const handleQRCreation_1 = require("../../helpers/qr-flow/handleQRCreation");
const ApiResponse_1 = require("../../config/ApiResponse");
const logger_1 = __importDefault(require("../../config/logger"));
const parseHelper_1 = require("../../helpers/parseHelper");
const mongoose_1 = __importDefault(require("mongoose"));
const newQRTypeModel_1 = require("../../models/qr-flow/newQRTypeModel");
const qrModel_1 = require("../../models/qr-flow/qrModel");
const generateSerialNumber_1 = require("../../utils/generateSerialNumber");
const constants_1 = require("../../config/constants");
const uploadToCloudinary_1 = require("../../config/uploadToCloudinary");
const secrets_1 = require("../../secrets");
const mailQRTemplateController_1 = require("./mailQRTemplateController");
const user_1 = require("../../models/auth/user");
exports.createNewQRType = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const filesArray = req.files;
        console.log('Files array : ', filesArray);
        const filesByField = {};
        for (const file of filesArray) {
            if (!filesByField[file.fieldname])
                filesByField[file.fieldname] = [];
            filesByField[file.fieldname].push(file);
        }
        // const newQRTypeData : INewQRTypeSchema = req.body;
        const rawData = req.body;
        console.log('Raw Data : ', rawData);
        const newQRTypeData = (0, parseHelper_1.parseRequestBody)(rawData, {
            arrays: ['qrUseCases', 'deliveryType', 'professionsAllowed'],
            booleans: ['includeGST', 'professionBased'],
            numbers: ['originalPrice', 'discountedPrice', 'stockCount'],
        });
        console.log('New QR Type Data : ', newQRTypeData);
        const validation = newQRTypeSchema_1.newQRTypeSchema.safeParse(newQRTypeData);
        console.log('Validation : ', (_a = validation.error) === null || _a === void 0 ? void 0 : _a.errors[0]);
        if (!validation.success)
            return (0, ApiResponse_1.ApiResponse)(res, 500, 'Failed to create QR Type!', false, null);
        const newQR = yield (0, handleQRCreation_1.handleQRTypeCreation)(validation.data, filesByField);
        return (0, ApiResponse_1.ApiResponse)(res, 201, 'New QR Type created successfully', true, newQR);
    }
    catch (error) {
        logger_1.default.error('Create QR Type Error:', error);
        return (0, ApiResponse_1.ApiResponse)(res, 500, 'Failed to create QR Type!', false, null, error.message);
    }
}));
const createAndSaveQR = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { qrTypeId, createdBy, createdFor, transactionId, deliveryType, shippingAddress, } = params;
    const newQRType = yield newQRTypeModel_1.QRMetaData.findById(qrTypeId);
    const backgroundImage = newQRType === null || newQRType === void 0 ? void 0 : newQRType.qrBackgroundImage;
    const icon = newQRType === null || newQRType === void 0 ? void 0 : newQRType.qrIcon;
    const qrId = new mongoose_1.default.Types.ObjectId();
    const frontendUrl = secrets_1.NODE_ENV === 'dev' ? secrets_1.FRONTEND_BASE_URL_DEV : secrets_1.FRONTEND_BASE_URL_PROD_DOMAIN;
    const qrRawData = `${frontendUrl}/qr/scan/${qrId.toString()}`;
    const QRCode = yield Promise.resolve().then(() => __importStar(require('qrcode')));
    const qrBuffer = yield QRCode.toBuffer(qrRawData, { type: 'png' });
    const cloudinaryResult = yield (0, uploadToCloudinary_1.uploadToCloudinary)(qrBuffer, 'qr_codes/', 'image');
    const serialNumber = (0, generateSerialNumber_1.generateRandomSerialNumber)();
    const orderStatus = deliveryType == constants_1.DeliveryType.ETAG ? constants_1.OrderStatus.DELIVERED : constants_1.OrderStatus.SHIPPED;
    const qr = yield qrModel_1.QRModel.create({
        _id: qrId,
        qrTypeId: qrTypeId,
        serialNumber: serialNumber,
        createdBy: createdBy,
        createdFor: createdFor,
        deliveryType: deliveryType,
        shippingDetails: shippingAddress,
        transactionId: transactionId,
        qrRawData: qrRawData,
        qrUrl: cloudinaryResult.secure_url,
        orderStatus: orderStatus
    });
    yield user_1.User.findByIdAndUpdate(createdFor, { $inc: { totalGeneratedQRs: 1 } }, { new: true });
    console.log("Serial Number : ", serialNumber);
    console.log("Cloudinary URL : ", cloudinaryResult.secure_url);
    const isMailSent = yield (0, mailQRTemplateController_1.mailQR)(serialNumber, cloudinaryResult.secure_url, params.currentUserIdLoggedIn);
    console.log("QR is : ", qr);
    return qr;
});
exports.createAndSaveQR = createAndSaveQR;
