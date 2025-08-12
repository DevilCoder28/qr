import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from '../secrets';

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folderPath: string,
  resourceType: 'image' | 'raw' = 'image',
  publicId?: string, 
  format?: string     
) => {
  return new Promise((resolve, reject) => {
    const options: any = {
      folder: folderPath,
      resource_type: resourceType,
      type : 'upload'
    };

    if (publicId) 
      options.public_id = publicId;
    if (format) 
      options.format = format;

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    const readable = new Readable();
    readable._read = () => {};
    readable.push(fileBuffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};
