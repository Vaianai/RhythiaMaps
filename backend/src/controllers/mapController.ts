import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { mapService, downloadService, ratingService } from '../services';
import { CreateMapSchema, QueryMapsSchema, CreateRatingSchema } from '../utils/validators';
import { uploadToS3, deleteFromS3, uploadCoverToS3 } from '../utils/s3';
import { isValidFileExtension, parseSoundSpaceTextMap } from '../utils/helpers';
import sharp from 'sharp';

export const uploadMap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('=== UPLOAD MAP REQUEST ===');
    console.log('User:', req.user);
    console.log('Body keys:', Object.keys(req.body));
    console.log('Files present:', !!req.files);
    if (req.files) {
      console.log('Files keys:', Object.keys(req.files));
      Object.entries(req.files).forEach(([key, files]: any) => {
        console.log(`  ${key}: ${files.length} file(s)`);
      });
    }
    
    if (!req.user) {
      console.log('❌ Not authenticated');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get files from multer fields
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    if (!files || !files.file || !files.file[0]) {
      console.log('❌ No file received. Files object:', files);
      res.status(400).json({ error: 'No map file provided' });
      return;
    }

    // Cover image è opzionale - fallback a placeholder se non fornito
    const mapFile = files.file[0];
    const coverImageFile = files.coverImage?.[0];

    const sourceType = req.body.sourceType === 'soundspace' ? 'soundspace' : 'rhythia';
    const allowedExtensions = sourceType === 'soundspace' ? ['txt'] : ['sspm'];
    if (!isValidFileExtension(mapFile.originalname, allowedExtensions)) {
      res.status(400).json({ error: 'Invalid file extension' });
      return;
    }

    if (sourceType === 'soundspace') {
      try {
        parseSoundSpaceTextMap(mapFile.buffer.toString('utf-8'));
      } catch (error: any) {
        res.status(400).json({ error: `Invalid Sound Space text map: ${error.message}` });
        return;
      }
    }

    // Validate cover image extension if provided
    if (coverImageFile && !['image/jpeg', 'image/png'].includes(coverImageFile.mimetype)) {
      res.status(400).json({ error: 'Cover image must be JPG or PNG' });
      return;
    }

    // Validate file size
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '52428800');
    if (mapFile.size > maxSize) {
      res.status(400).json({ error: 'File too large' });
      return;
    }

    const parseTags = (rawTags: unknown): string[] | undefined => {
      if (!rawTags || typeof rawTags !== 'string') return undefined;
      try {
        const parsed = JSON.parse(rawTags);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    };

    const parseNumber = (value: unknown, fallback: number): number => {
      const parsed = typeof value === 'string' ? Number(value) : Number(value ?? fallback);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    // Parse request body - convert string numbers to actual numbers
    const bodyData = {
      title: req.body.title,
      artist: req.body.artist,
      mapper: req.body.mapper,
      sourceType,
      difficulty: parseNumber(req.body.difficulty, 1),
      bpm: req.body.bpm ? parseNumber(req.body.bpm, 120) : undefined,
      duration: parseNumber(req.body.duration, 1),
      noteCount: parseNumber(req.body.noteCount, 0),
      description: req.body.description || undefined,
      tags: parseTags(req.body.tags),
    };

    console.log('Parsed body data:', bodyData);

    // Validate with schema
    const validatedData = CreateMapSchema.parse(bodyData);
    console.log('✅ Validation passed');

    // Upload map file to S3
    const fileUrl = await uploadToS3(
      mapFile.buffer,
      mapFile.originalname,
      mapFile.mimetype
    );

    // Upload and resize cover image
    let coverUrl = '';
    if (coverImageFile) {
      try {
        // Resize cover image to 300x300
        const resizedCover = await sharp(coverImageFile.buffer)
          .resize(300, 300, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        coverUrl = await uploadCoverToS3(resizedCover, Date.now());
      } catch (error) {
        console.error('Error processing cover image:', error);
        res.status(400).json({ error: 'Failed to process cover image' });
        return;
      }
    } else {
      // Use a placeholder SVG data URL if no cover image provided
      coverUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%231a0933" width="300" height="300"/%3E%3Crect fill="none" stroke="%236D28D9" stroke-width="2" x="10" y="10" width="280" height="280"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="16" fill="%23A78BFA" text-anchor="middle" dominant-baseline="middle"%3ENo Cover Image%3C/text%3E%3C/svg%3E';
    }

    // Create map in database
    const map = await mapService.createMap({
      ...validatedData,
      fileUrl,
      coverUrl,
      uploaderId: req.user.id,
    });

    res.status(201).json({
      message: 'Map uploaded successfully',
      map,
    });
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getMaps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = QueryMapsSchema.parse(req.query);
    const offset = (query.page - 1) * query.limit;

    const { maps, total } = await mapService.getMaps({
      sort: query.sort,
      search: query.search,
      sourceType: query.sourceType,
      difficulty: query.difficulty,
      limit: query.limit,
      offset,
    });

    res.status(200).json({
      maps,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const map = await mapService.getMapById(parseInt(id));

    if (!map) {
      res.status(404).json({ error: 'Map not found' });
      return;
    }

    res.status(200).json(map);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const map = await mapService.getMapById(parseInt(id));

    if (!map) {
      res.status(404).json({ error: 'Map not found' });
      return;
    }

    if (map.uploaderId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Delete from S3
    await deleteFromS3(map.fileUrl);
    await deleteFromS3(map.coverUrl);

    // Delete from database
    await mapService.deleteMap(parseInt(id), req.user.id);

    res.status(200).json({ message: 'Map deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPopularMaps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const maps = await mapService.getPopularMaps(limit);

    res.status(200).json(maps);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRecentMaps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const maps = await mapService.getRecentMaps(limit);

    res.status(200).json(maps);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
