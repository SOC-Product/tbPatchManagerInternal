import multer from 'multer';
import path from 'path';

const createFileFilter = (allowedExtensions) => {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${allowedExtensions.join(', ')} files allowed`), false);
    }
  };
};

// CSV upload
export const uploadCsvFile = multer({
  storage: multer.memoryStorage(),
  fileFilter: createFileFilter(['.csv']),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// SSH key upload
export const uploadSSHKey = multer({
  storage: multer.memoryStorage(),
  fileFilter: createFileFilter(['.pem', '.ppk']),
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

export const uploadCsvFileMiddleware = (req, res, next) => {
  uploadCsvFile.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};
