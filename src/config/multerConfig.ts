import multer from 'multer';
import { allowedFileTypes } from './constants';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!allowedFileTypes.includes(file.mimetype)) {
      return callback(new Error('Unsupported file type: ' + file.mimetype));
    }

    callback(null, true);
  },
});
