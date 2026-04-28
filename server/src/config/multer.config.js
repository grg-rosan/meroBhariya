// src/config/multer.config.js
import fs   from "fs";
import path from "path";
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


const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = "uploads/tmp";
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const documentFileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new AppError(`File type not allowed: ${file.mimetype}`, 400), false);
};

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: documentFileFilter,
});

// multer.config.js
export const uploadMerchantDocs = documentUpload.fields([
  { name: "PAN_CERTIFICATE",       maxCount: 1 },
  { name: "BUSINESS_REGISTRATION", maxCount: 1 },
  { name: "TAX_CLEARANCE",         maxCount: 1 },
  { name: "OWNER_CITIZENSHIP",     maxCount: 1 },
  { name: "OWNER_PHOTO",           maxCount: 1 },
]);
export const uploadRiderDocs = documentUpload.fields([
  { name: 'CITIZENSHIP_FRONT',    maxCount: 1 },
  { name: 'CITIZENSHIP_BACK',     maxCount: 1 },
  { name: 'DRIVING_LICENSE_FRONT',maxCount: 1 },
  { name: 'VEHICLE_BLUEBOOK',     maxCount: 1 },
  { name: 'RIDER_PHOTO',          maxCount: 1 },
]);