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
exports.renderTemplate = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const html_to_text_1 = require("html-to-text");
const handlebars_1 = __importDefault(require("handlebars"));
const constants_1 = require("../config/constants");
const renderTemplate = (template, data) => __awaiter(void 0, void 0, void 0, function* () {
    const templatePath = path_1.default.join(constants_1.TEMPLATE_DIR, `${template}.html`);
    const templateContent = yield fs_1.default.promises.readFile(templatePath, 'utf-8');
    const compiledTemplate = handlebars_1.default.compile(templateContent);
    const html = compiledTemplate(data);
    const text = (0, html_to_text_1.htmlToText)(html);
    return { html, text };
});
exports.renderTemplate = renderTemplate;
