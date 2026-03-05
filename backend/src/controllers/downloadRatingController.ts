import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { downloadService, mapService, ratingService } from '../services';
import { CreateRatingSchema } from '../utils/validators';

export const downloadMap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const mapId = parseInt(id);

    if (!Number.isFinite(mapId) || mapId <= 0) {
      res.status(400).json({ error: 'Invalid map id' });
      return;
    }

    const map = await mapService.getMapById(mapId);
    if (!map) {
      res.status(404).json({ error: 'Map not found' });
      return;
    }

    const forwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : (forwardedFor || '').split(',')[0]?.trim();
    const sourceIp = forwardedIp || req.socket.remoteAddress || req.ip || 'unknown-ip';

    // Record download
    await downloadService.recordDownload(mapId, req.user?.id, sourceIp);

    res.status(200).json({
      message: 'Download recorded',
      downloadUrl: map.fileUrl,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMapDownloads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const mapId = parseInt(id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { downloads, total } = await downloadService.getMapDownloads(mapId, limit, offset);

    res.status(200).json({
      downloads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserDownloads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { downloads, total } = await downloadService.getUserDownloads(
      req.user.id,
      limit,
      offset
    );

    res.status(200).json({
      downloads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createRating = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const mapId = parseInt(id);

    const validatedData = CreateRatingSchema.parse(req.body);

    const rating = await ratingService.createRating(
      mapId,
      req.user.id,
      validatedData.rating,
      validatedData.comment
    );

    res.status(201).json({
      message: 'Rating created successfully',
      rating,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateRating = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const mapId = parseInt(id);

    const validatedData = CreateRatingSchema.parse(req.body);

    const rating = await ratingService.updateRating(
      mapId,
      req.user.id,
      validatedData.rating,
      validatedData.comment
    );

    res.status(200).json({
      message: 'Rating updated successfully',
      rating,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteRating = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const mapId = parseInt(id);

    await ratingService.deleteRating(mapId, req.user.id);

    res.status(200).json({
      message: 'Rating deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMapRatings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const mapId = parseInt(id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { ratings, total } = await ratingService.getMapRatings(mapId, limit, offset);

    res.status(200).json({
      ratings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserRating = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const mapId = parseInt(id);

    const rating = await ratingService.getUserRating(mapId, req.user.id);

    if (!rating) {
      res.status(404).json({ error: 'Rating not found' });
      return;
    }

    res.status(200).json(rating);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
