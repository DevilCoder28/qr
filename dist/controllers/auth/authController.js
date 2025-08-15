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
exports.generateReferralLink = exports.getReferralLink = exports.resetUserProfile = exports.updateUserProfile = exports.getUserFromUserId = exports.logout = exports.resetPassword = exports.forgotPassword = exports.resendVerificationLink = exports.verifyEmail = exports.login = exports.signUp = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const authSchema_1 = require("../../validators/auth/authSchema");
const user_1 = require("../../models/auth/user");
const ApiResponse_1 = require("../../config/ApiResponse");
const bcrypt_1 = __importDefault(require("bcrypt"));
const secrets_1 = require("../../secrets");
const mailer_1 = require("../../config/mailer");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const constants_1 = require("../../config/constants");
const enums_1 = require("../../enums/enums");
const templateRenderer_1 = require("../../utils/templateRenderer");
const hashids_1 = __importDefault(require("hashids"));
const qrModel_1 = require("../../models/qr-flow/qrModel");
const uploadToCloudinary_1 = require("../../config/uploadToCloudinary");
exports.signUp = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const signUpData = req.body;
        const validation = authSchema_1.signUpSchema.safeParse(signUpData);
        const hashids = new hashids_1.default(secrets_1.HASH_ID_SECRET_SALT, 10);
        console.log((_a = validation.error) === null || _a === void 0 ? void 0 : _a.errors);
        if (!validation.success)
            return (0, ApiResponse_1.ApiResponse)(res, 400, "Validation failed for User Schema", false, null, "Error occurred in validation");
        const existingUser = yield user_1.User.findOne({
            email: (_b = validation.data) === null || _b === void 0 ? void 0 : _b.email,
        });
        if (existingUser)
            return (0, ApiResponse_1.ApiResponse)(res, 400, "User already exists", false, null, "Could not create a user");
        const hashedPassword = yield bcrypt_1.default.hash(validation.data.password, 10);
        const user = yield user_1.User.create(Object.assign(Object.assign({}, validation.data), { password: hashedPassword }));
        if (user) {
            if ((_c = validation.data) === null || _c === void 0 ? void 0 : _c._tk) {
                const _tk = hashids.decodeHex((_d = validation.data) === null || _d === void 0 ? void 0 : _d._tk);
                const referralUser = yield user_1.User.findById(_tk);
                const totalDigitalPoints = referralUser === null || referralUser === void 0 ? void 0 : referralUser.digitalWalletCoins;
                const updatedUser = yield user_1.User.updateOne({ _id: _tk }, {
                    digitalWalletCoins: totalDigitalPoints || 0 + 5,
                });
            }
        }
        const verificationToken = jsonwebtoken_1.default.sign({ userId: user._id }, secrets_1.JWT_SECRET, {
            expiresIn: "1h",
        });
        const frontendBaseUrl = secrets_1.NODE_ENV == "dev"
            ? secrets_1.FRONTEND_BASE_URL_DEV
            : secrets_1.FRONTEND_BASE_URL_PROD_DOMAIN;
        const verificationLink = `${frontendBaseUrl}/auth/verify-email?token=${verificationToken}`;
        const emailContent = {
            user_name: user.firstName,
            verification_link: verificationLink,
            app_name: constants_1.APP_NAME,
        };
        const { html, text } = yield (0, templateRenderer_1.renderTemplate)(enums_1.MailTemplate.VERIFY_EMAIL, emailContent);
        yield (0, mailer_1.sendEmail)(user.email, `Verify Your Email at ${constants_1.APP_NAME}`, text, html);
        return (0, ApiResponse_1.ApiResponse)(res, 200, "Successfully sent email for verification!", true, null);
    }
    catch (error) {
        return (0, ApiResponse_1.ApiResponse)(res, 404, "Error occurred signing up!", false, null, error.message);
    }
}));
exports.login = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const loginData = req.body;
        const validation = authSchema_1.loginSchema.safeParse(loginData);
        if (!validation.success)
            return (0, ApiResponse_1.ApiResponse)(res, 400, "Error occurred validation login schema", false, null, "Validation Error");
        const user = yield user_1.User.findOne({ email: validation.data.email });
        if (!user)
            return (0, ApiResponse_1.ApiResponse)(res, 400, "No such user exists", false, null, "User not found!");
        const isValidPassword = yield bcrypt_1.default.compare(validation.data.password, user === null || user === void 0 ? void 0 : user.password);
        if (!user || !isValidPassword)
            return (0, ApiResponse_1.ApiResponse)(res, 401, "Invalid Credentials", false, null, "Login Error!");
        if (!user.isVerified)
            return (0, ApiResponse_1.ApiResponse)(res, 403, "Email is not verified!", false, null, "Unverified Email");
        const token = jsonwebtoken_1.default.sign({ userId: user._id, roles: user.roles }, secrets_1.JWT_SECRET, {
            expiresIn: "7d",
        });
        // Determine cookie settings based on environment
        const cookieOptions = {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        };
        if (process.env.NODE_ENV === "production") {
            cookieOptions.secure = true;
            cookieOptions.sameSite = "none";
        }
        else {
            // Development environment - allow HTTP
            cookieOptions.secure = false;
            cookieOptions.sameSite = "lax";
        }
        res.cookie("token", token, cookieOptions);
        return (0, ApiResponse_1.ApiResponse)(res, 201, "Login Successful", true, { token });
    }
    catch (err) {
        return (0, ApiResponse_1.ApiResponse)(res, 404, "Error occurred while logging in", false, null, "Login error");
    }
}));
exports.verifyEmail = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.query;
    if (!token) {
        return (0, ApiResponse_1.ApiResponse)(res, 400, "No token provided", false, null, "Verification failed");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secrets_1.JWT_SECRET);
        const user = yield user_1.User.findById(decoded.userId);
        if (!user) {
            return (0, ApiResponse_1.ApiResponse)(res, 400, "User not found", false, null, "Verification failed");
        }
        if (user.isVerified) {
            return (0, ApiResponse_1.ApiResponse)(res, 400, "Email already verified", false, null, "Email already verified");
        }
        yield user_1.User.findByIdAndUpdate(user._id, {
            $set: { isVerified: true },
        });
        return (0, ApiResponse_1.ApiResponse)(res, 200, "Email verified successfully", true, null);
    }
    catch (err) {
        return (0, ApiResponse_1.ApiResponse)(res, 400, "Invalid or expired verification link", false, null, "Verification failed");
    }
}));
exports.resendVerificationLink = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const emailData = req.body;
    const validation = authSchema_1.resendVerificationEmailSchema.safeParse(emailData);
    if (!validation.success)
        return (0, ApiResponse_1.ApiResponse)(res, 400, "Error occurred in parsing email", false, null, "Email is Invalid");
    const user = yield user_1.User.findOne({ email: validation.data.email });
    if (!user) {
        return (0, ApiResponse_1.ApiResponse)(res, 404, "User not found", false, null);
    }
    if (user.isVerified) {
        return (0, ApiResponse_1.ApiResponse)(res, 400, "User is already verified", false, null);
    }
    const verificationToken = jsonwebtoken_1.default.sign({ userId: user._id }, secrets_1.JWT_SECRET, {
        expiresIn: "1h",
    });
    const frontendBaseUrl = secrets_1.NODE_ENV == "dev" ? secrets_1.FRONTEND_BASE_URL_DEV : secrets_1.FRONTEND_BASE_URL_PROD_DOMAIN;
    const verificationLink = `${frontendBaseUrl}/auth/verify-email?token=${verificationToken}`;
    const emailContent = {
        user_name: user.firstName,
        verification_link: verificationLink,
        app_name: constants_1.APP_NAME,
    };
    const { html, text } = yield (0, templateRenderer_1.renderTemplate)(enums_1.MailTemplate.VERIFY_EMAIL, emailContent);
    yield (0, mailer_1.sendEmail)(user.email, "Resend Verification Link", text, html);
    return (0, ApiResponse_1.ApiResponse)(res, 200, "Verification link resent successfully", true, null);
}));
exports.forgotPassword = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const forgotPasswordData = req.body;
    const validation = authSchema_1.forgotPasswordSchema.safeParse(forgotPasswordData);
    if (!validation.success)
        return (0, ApiResponse_1.ApiResponse)(res, 400, "Error occurred in parsing email", false, null, "Email is Invalid");
    const user = yield user_1.User.findOne({ email: validation.data.email });
    if (!user) {
        return (0, ApiResponse_1.ApiResponse)(res, 404, "User not found", false, null);
    }
    const resetToken = jsonwebtoken_1.default.sign({ userId: user._id }, secrets_1.JWT_SECRET, {
        expiresIn: "1h",
    });
    const frontendBaseUrl = secrets_1.NODE_ENV == "dev" ? secrets_1.FRONTEND_BASE_URL_DEV : secrets_1.FRONTEND_BASE_URL_PROD_DOMAIN;
    const resetLink = `${frontendBaseUrl}/auth/reset-password?token=${resetToken}`;
    const emailContent = {
        user_name: user.firstName,
        reset_link: resetLink,
        app_name: constants_1.APP_NAME,
    };
    const { html, text } = yield (0, templateRenderer_1.renderTemplate)(enums_1.MailTemplate.RESET_PASSWORD, emailContent);
    yield (0, mailer_1.sendEmail)(user.email, "Password Reset Link", text, html);
    return (0, ApiResponse_1.ApiResponse)(res, 200, "Password reset link sent to email", true, null);
}));
exports.resetPassword = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { password } = req.body;
    const { token } = req.query;
    if (!token || !password) {
        return (0, ApiResponse_1.ApiResponse)(res, 400, "Token or password missing", false, null, "Reset failed");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token.toString(), secrets_1.JWT_SECRET);
        const user = yield user_1.User.findById(decoded.userId);
        if (!user) {
            return (0, ApiResponse_1.ApiResponse)(res, 404, "User not found", false, null);
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        yield user_1.User.findByIdAndUpdate(user._id, {
            $set: { password: hashedPassword },
        });
        return (0, ApiResponse_1.ApiResponse)(res, 200, "Password reset successfully", true, null);
    }
    catch (err) {
        return (0, ApiResponse_1.ApiResponse)(res, 400, "Invalid or expired reset password link", false, null, "Reset failed");
    }
}));
exports.logout = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 0,
        });
        return (0, ApiResponse_1.ApiResponse)(res, 200, "Logged out successfully", true, null);
    }
    catch (error) {
        return (0, ApiResponse_1.ApiResponse)(res, 500, "Error occurred while logging out", false, null, error.message);
    }
}));
exports.getUserFromUserId = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.data) === null || _a === void 0 ? void 0 : _a.userId;
    const user = yield user_1.User.findById(userId).lean();
    if (!user) {
        throw new Error("User not found");
    }
    const qrs = yield qrModel_1.QRModel.find({ createdFor: userId })
        .populate("qrTypeId", "qrName")
        .select("qrTypeId qrStatus qrUrl")
        .lean();
    const qrList = qrs.map((qr) => {
        var _a;
        return ({
            qrName: ((_a = qr.qrTypeId) === null || _a === void 0 ? void 0 : _a.qrName) || "",
            qrStatus: qr.qrStatus,
            qrUrl: qr.qrUrl,
        });
    });
    const response = {
        userId: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar || null,
        email: user.email,
        digitalWalletCoins: user.digitalWalletCoins || 0,
        totalNumberOfQRsGenerated: qrList.length || 0,
        referralLink: yield (0, exports.getReferralLink)(user._id.toString()),
        qrs: qrList,
        about: user.about || null,
        phoneNumber: user.phoneNumber || null,
        altMobileNumber: user.altMobileNumber || null,
        vehicleNumber: user.vehicleNumber || null,
        vehicleType: user.vehicleType || null,
        deviceTokens: user.deviceTokens || [],
    };
    return (0, ApiResponse_1.ApiResponse)(res, 200, "User Profile Fetched successfully!", true, response);
}));
exports.updateUserProfile = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.data) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        return (0, ApiResponse_1.ApiResponse)(res, 401, "Unauthorized", false);
    }
    const { firstName, lastName, phoneNumber, about, altMobileNumber, vehicleNumber, vehicleType } = req.body;
    const file = req.file;
    const user = yield user_1.User.findById(userId);
    if (!user) {
        return (0, ApiResponse_1.ApiResponse)(res, 404, "User not found", false);
    }
    if (file) {
        try {
            const cloudinaryResult = yield (0, uploadToCloudinary_1.uploadToCloudinary)(file.buffer, `users/${userId}`, "image", `avatar-${userId}`);
            user.avatar = cloudinaryResult.secure_url;
        }
        catch (err) {
            console.error("Cloudinary upload error:", err);
            return (0, ApiResponse_1.ApiResponse)(res, 500, "Failed to upload avatar", false);
        }
    }
    if (firstName)
        user.firstName = firstName;
    if (lastName)
        user.lastName = lastName;
    if (phoneNumber)
        user.phoneNumber = phoneNumber;
    if (about)
        user.about = about;
    if (altMobileNumber)
        user.altMobileNumber = altMobileNumber;
    if (vehicleNumber)
        user.vehicleNumber = vehicleNumber;
    if (vehicleType)
        user.vehicleType = vehicleType;
    yield user.save();
    return (0, ApiResponse_1.ApiResponse)(res, 200, "Profile updated successfully!", true, {
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        about: user.about || null,
        phoneNumber: user.phoneNumber || null,
        altMobileNumber: user.altMobileNumber || null,
        vehicleNumber: user.vehicleNumber || null,
        vehicleType: user.vehicleType || null,
    });
}));
exports.resetUserProfile = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.data) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        return (0, ApiResponse_1.ApiResponse)(res, 401, 'Unauthorized', false, null);
    }
    const resetFields = {
        avatar: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        altMobileNumber: "",
        vehicleNumber: "",
        vehicleType: "",
        about: ""
    };
    const user = yield user_1.User.findByIdAndUpdate(userId, resetFields, { new: true });
    if (!user) {
        return (0, ApiResponse_1.ApiResponse)(res, 404, 'User not found', false, null);
    }
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'Profile reset successfully', true, {
        userData: {
            avatar: user.avatar,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            altMobileNumber: user.altMobileNumber,
            vehicleNumber: user.vehicleNumber,
            vehicleType: user.vehicleType,
            about: user.about
        }
    });
}));
const getReferralLink = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.User.findById(userId);
    let encodedReferralLink = secrets_1.FRONTEND_SIGNUP_URL;
    if (userId) {
        const hashids = new hashids_1.default(secrets_1.HASH_ID_SECRET_SALT, 10);
        const encodedData = hashids.encodeHex(userId.toString());
        encodedReferralLink = secrets_1.FRONTEND_SIGNUP_URL + "?_tk=" + encodedData;
    }
    return encodedReferralLink;
});
exports.getReferralLink = getReferralLink;
exports.generateReferralLink = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield user_1.User.findById((_a = req.data) === null || _a === void 0 ? void 0 : _a.userId);
    const userId = user === null || user === void 0 ? void 0 : user._id;
    if (!user)
        return (0, ApiResponse_1.ApiResponse)(res, 404, "Referral Link not found!", true, null);
    let encodedReferralLink = secrets_1.FRONTEND_SIGNUP_URL;
    if (userId) {
        const hashids = new hashids_1.default(secrets_1.HASH_ID_SECRET_SALT, 10);
        const encodedData = hashids.encodeHex(userId.toString());
        encodedReferralLink = secrets_1.FRONTEND_SIGNUP_URL + "?_tk=" + encodedData;
    }
    return (0, ApiResponse_1.ApiResponse)(res, 200, "Referral Link Generated", true, encodedReferralLink);
}));
