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
exports.connectToDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const secrets_1 = require("../secrets");
const logger_1 = __importDefault(require("./logger"));
const connectToDatabase = (MAX_RETRIES) => __awaiter(void 0, void 0, void 0, function* () {
    let attempts = 0;
    while (attempts < MAX_RETRIES) {
        try {
            yield mongoose_1.default.connect(secrets_1.MONGODB_DATABASE_URL, {
                dbName: secrets_1.MONGODB_DATABASE_NAME,
            });
            logger_1.default.debug('Database connected successfully!');
            return;
        }
        catch (error) {
            attempts += 1;
            logger_1.default.debug(`Error connecting to MongoDB (Attempt ${attempts}): ${error}`);
            if (attempts === MAX_RETRIES) {
                logger_1.default.error('Max connection attempts reached. Exiting...');
                process.exit(1);
            }
            yield new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }
});
exports.connectToDatabase = connectToDatabase;
