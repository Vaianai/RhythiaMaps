import { Router } from 'express';
import multer from 'multer';
import * as mapController from '../controllers/mapController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/', optionalAuthMiddleware, mapController.getMaps);
router.get('/popular', optionalAuthMiddleware, mapController.getPopularMaps);
router.get('/recent', optionalAuthMiddleware, mapController.getRecentMaps);
router.get('/:id', optionalAuthMiddleware, mapController.getMap);

// Protected routes
router.post(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  mapController.uploadMap
);
router.delete('/:id', authMiddleware, mapController.deleteMap);

export default router;
