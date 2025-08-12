"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailTemplate = exports.UserRoles = void 0;
var UserRoles;
(function (UserRoles) {
    UserRoles["ADMIN"] = "ADMIN";
    UserRoles["BASIC_USER"] = "BASIC_USER";
    UserRoles["SALESPERSON"] = "SALES_PERSON";
})(UserRoles || (exports.UserRoles = UserRoles = {}));
var MailTemplate;
(function (MailTemplate) {
    MailTemplate["VERIFY_EMAIL"] = "verificationEmail";
    MailTemplate["RESET_PASSWORD"] = "resetPasswordEmail";
    MailTemplate["QR_CODE"] = "qrCode";
})(MailTemplate || (exports.MailTemplate = MailTemplate = {}));
