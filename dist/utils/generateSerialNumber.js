"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomSerialNumber = void 0;
const generateRandomSerialNumber = () => {
    let digits = '';
    for (let i = 0; i < 10; i++) {
        digits += Math.floor(Math.random() * 10);
    }
    return `DIGI${digits}`;
};
exports.generateRandomSerialNumber = generateRandomSerialNumber;
