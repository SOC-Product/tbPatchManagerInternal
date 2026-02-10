import multer from 'multer';
import path from 'path';

// storage config
const storage = multer.memoryStorage(); 
// memoryStorage = file.buffer available in service

// file filter
const fileFilter = (req, file, cb) => {
  const allowed = ['.pem', '.ppk'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only .pem and .ppk files allowed'), false);
  }
};

export const uploadCsvFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } //10MB
});

// multer instance
export const uploadSSHKey = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});
