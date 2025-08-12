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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleQRTypeCreation = void 0;
const uploadToCloudinary_1 = require("../../config/uploadToCloudinary");
const newQRTypeModel_1 = require("../../models/qr-flow/newQRTypeModel");
const uploadField = (files_1, folderPath_1, fieldName_1, ...args_1) => __awaiter(void 0, [files_1, folderPath_1, fieldName_1, ...args_1], void 0, function* (files, folderPath, fieldName, resourceType = 'image') {
    var _a;
    const file = (_a = files === null || files === void 0 ? void 0 : files[fieldName]) === null || _a === void 0 ? void 0 : _a[0];
    if (!file)
        return undefined;
    const result = yield (0, uploadToCloudinary_1.uploadToCloudinary)(file.buffer, folderPath, resourceType);
    return result.secure_url;
});
const handleQRTypeCreation = (data, files) => __awaiter(void 0, void 0, void 0, function* () {
    const folderPath = `qr_types/${data.qrName.replace(/\s+/g, '_')}`;
    const qrBackgroundImage = yield uploadField(files, folderPath, 'qrBackgroundImage');
    const qrIcon = yield uploadField(files, folderPath, 'qrIcon');
    const productImage = yield uploadField(files, folderPath, 'productImage');
    const pdfTemplate = yield uploadField(files, folderPath, 'pdfTemplate', 'raw');
    const enrichedProfessions = yield Promise.all((data.professionsAllowed || []).map((prof) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const fieldKey = `logo_${prof.name}`;
        if ((_a = files === null || files === void 0 ? void 0 : files[fieldKey]) === null || _a === void 0 ? void 0 : _a[0]) {
            const uploaded = yield (0, uploadToCloudinary_1.uploadToCloudinary)(files[fieldKey][0].buffer, `${folderPath}/professions`);
            return Object.assign(Object.assign({}, prof), { logoUrl: uploaded.secure_url });
        }
        return prof;
    })));
    const newQRType = yield newQRTypeModel_1.QRMetaData.create(Object.assign(Object.assign({}, data), { qrBackgroundImage,
        qrIcon,
        productImage,
        pdfTemplate, professionsAllowed: enrichedProfessions }));
    return newQRType;
});
exports.handleQRTypeCreation = handleQRTypeCreation;
