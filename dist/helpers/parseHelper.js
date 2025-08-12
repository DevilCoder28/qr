"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRequestBody = parseRequestBody;
function parseRequestBody(data, config) {
    const result = Object.assign({}, data);
    (config.arrays || []).forEach((field) => {
        if (typeof result[field] === 'string') {
            try {
                const parsed = JSON.parse(result[field]);
                if (Array.isArray(parsed)) {
                    result[field] = parsed;
                }
            }
            catch (_a) {
                result[field] = [];
            }
        }
    });
    (config.objects || []).forEach((field) => {
        if (typeof result[field] === 'string') {
            try {
                const parsed = JSON.parse(result[field]);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    result[field] = parsed;
                }
            }
            catch (_a) {
                result[field] = {};
            }
        }
    });
    (config.booleans || []).forEach((field) => {
        const val = result[field];
        if (typeof val === 'boolean') {
            result[field] = val;
        }
        else if (typeof val === 'string') {
            result[field] = val.toLowerCase() === 'true';
        }
        else {
            result[field] = false;
        }
    });
    (config.numbers || []).forEach((field) => {
        if (typeof result[field] === 'string') {
            const num = Number(result[field]);
            result[field] = isNaN(num) ? 0 : num;
        }
        else if (typeof result[field] !== 'number') {
            result[field] = 0;
        }
    });
    return result;
}
