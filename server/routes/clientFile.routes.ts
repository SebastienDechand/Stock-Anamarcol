import { Router } from 'express';
import * as clientFileController from '../controllers/clientFile/clientFile.controller';
import { requireAuth, requireAdmin, requireMonteur } from '../middleware/auth/auth.middleware';
import { ErrorCode } from '../constants/errorCodes';

const router = Router();

// All authenticated users can view
router.get('/', requireAuth, clientFileController.getClientFiles);
router.get('/:id', requireAuth, clientFileController.getClientFile);

// Create / update: monteur, admin, superadmin
router.post('/', requireMonteur, clientFileController.createClientFile);
router.put('/:id', requireMonteur, clientFileController.updateClientFile);

// Documents: upload (monteur+) and delete (monteur+)
router.post(
  '/:id/documents',
  requireMonteur,
  (req, res, next) => {
    clientFileController.docUpload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400).json({
          message: (err as Error).message,
          code: ErrorCode.CLIENT_FILE_UPLOAD_ERROR,
        });
        return;
      }
      next();
    });
  },
  clientFileController.uploadDocument,
);
router.delete('/:id/documents/:docId', requireMonteur, clientFileController.deleteDocument);

// Delete: admin/superadmin only
router.delete('/:id', requireAdmin, clientFileController.deleteClientFile);

export default router;
