"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
const secrets_1 = require("../secrets");
cloudinary_1.v2.config({
    cloud_name: secrets_1.CLOUDINARY_CLOUD_NAME,
    api_key: secrets_1.CLOUDINARY_API_KEY,
    api_secret: secrets_1.CLOUDINARY_API_SECRET,
});
const uploadToCloudinary = (fileBuffer, folderPath, resourceType = 'image', publicId, format) => {
    return new Promise((resolve, reject) => {
        const options = {
            folder: folderPath,
            resource_type: resourceType,
            type: 'upload'
        };
        if (publicId)
            options.public_id = publicId;
        if (format)
            options.format = format;
        const uploadStream = cloudinary_1.v2.uploader.upload_stream(options, (error, result) => {
            if (error)
                return reject(error);
            resolve(result);
        });
        const readable = new stream_1.Readable();
        readable._read = () => { };
        readable.push(fileBuffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
