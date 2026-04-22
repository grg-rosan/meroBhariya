// src/config/multer.config.js
import multer from 'multer';
import AppError from '../utils/error/appError.js';
const ALLOWED_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',                                           // .xls
];

const storage = multer.memoryStorage(); // keep file in buffer, no disk write

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(AppError(400, 'Only .xlsx and .xls files are allowed.'), false);
  }
};

export const uploadExcel = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).single('file');