import { Router } from 'express';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  searchVehicles,
  uploadDocument,
  deleteDocument,
} from '../controllers/vehicle/vehicle.controller';
import { requireAdmin } from '../middleware/auth/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads/vehicules');
fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for vehicle document uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xlsx|xls|jpg|jpeg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// #region Vehicle routes (require authentication)
router.get('/', requireAdmin, getAllVehicles);
router.get('/search', requireAdmin, searchVehicles);
router.get('/:id', requireAdmin, getVehicleById);
router.post('/', requireAdmin, createVehicle);
router.put('/:id', requireAdmin, updateVehicle);
router.delete('/:id', requireAdmin, deleteVehicle);
// #endregion

// #region Document routes
router.post('/:id/documents', requireAdmin, upload.single('file'), uploadDocument);
router.delete('/:id/documents/:docId', requireAdmin, deleteDocument);
// #endregion

export default router;
