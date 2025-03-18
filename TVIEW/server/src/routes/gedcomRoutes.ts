import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadGedcomFile } from '../controllers/gedcomController';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `gedcom-${timestamp}${extension}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only allow .ged files
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.ged') {
      return cb(new Error('Only GEDCOM (.ged) files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  }
});

// Route to upload and parse GEDCOM file
router.post('/upload', upload.single('gedcomFile'), uploadGedcomFile);

export default router;
