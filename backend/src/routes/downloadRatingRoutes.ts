import { Router } from 'express';
import * as controller from '../controllers/downloadRatingController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// Download routes
router.post('/maps/:id/download', optionalAuthMiddleware, controller.downloadMap);
router.get('/maps/:id/downloads', authMiddleware, controller.getMapDownloads);
router.get('/user/downloads', authMiddleware, controller.getUserDownloads);

// Rating routes
router.post('/maps/:id/ratings', authMiddleware, controller.createRating);
router.put('/maps/:id/ratings', authMiddleware, controller.updateRating);
router.delete('/maps/:id/ratings', authMiddleware, controller.deleteRating);
router.get('/maps/:id/ratings', optionalAuthMiddleware, controller.getMapRatings);
router.get('/maps/:id/my-rating', authMiddleware, controller.getUserRating);

export default router;
