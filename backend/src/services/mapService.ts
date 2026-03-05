import { Map } from '@prisma/client';
import { CreateMapInput } from '../utils/validators';
import { mockMaps } from '../utils/mockDb';
import { getUserById } from './userService';

// In-memory store for maps created during development
let maps: any[] = [...mockMaps];
let nextMapId = maps.length > 0 ? Math.max(...maps.map(m => m.id)) + 1 : 1;

const getUploaderInfo = async (uploaderId: number, mapperName?: string) => {
  const user = await getUserById(uploaderId);
  return {
    id: uploaderId,
    username: user?.username || mapperName || 'unknown',
  };
};

export const getMapById = async (id: number) => {
  const map = maps.find((m) => m.id === id);
  if (!map) return null;

  const uploader = await getUploaderInfo(map.uploaderId, map.mapper);

  let normalizedTags: string[] = [];
  if (Array.isArray(map.tags)) {
    normalizedTags = map.tags;
  } else if (typeof map.tags === 'string') {
    try {
      const parsed = JSON.parse(map.tags || '[]');
      normalizedTags = Array.isArray(parsed) ? parsed : [];
    } catch {
      normalizedTags = [];
    }
  }

  return {
    ...map,
    sourceType: map.sourceType || 'rhythia',
    tags: normalizedTags,
    uploader,
  };
};

export const createMap = async (data: CreateMapInput & {
  fileUrl: string;
  coverUrl: string;
  uploaderId: number;
}): Promise<Map> => {
  const newMap = {
    id: nextMapId++,
    title: data.title,
    artist: data.artist,
    mapper: data.mapper,
    sourceType: data.sourceType,
    difficulty: data.difficulty,
    duration: data.duration,
    bpm: data.bpm,
    noteCount: data.noteCount,
    fileUrl: data.fileUrl,
    coverUrl: data.coverUrl,
    description: data.description || '',
    tags: data.tags ? JSON.stringify(data.tags) : null,
    downloadCount: 0,
    weeklyDownloadCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    uploaderId: data.uploaderId,
  };

  maps.push(newMap);
  return newMap as Map;
};

export const getMaps = async (
  options: {
    sort?: 'latest' | 'most_downloaded' | 'weekly' | 'top_rated';
    search?: string;
    sourceType?: 'rhythia' | 'soundspace';
    difficulty?: number;
    limit?: number;
    offset?: number;
  } = {}
) => {
  const {
    sort = 'latest',
    search,
    sourceType,
    difficulty,
    limit = 20,
    offset = 0,
  } = options;

  // Filter maps
  let filtered = [...maps];

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.title.toLowerCase().includes(searchLower) ||
        m.artist.toLowerCase().includes(searchLower) ||
        m.mapper.toLowerCase().includes(searchLower)
    );
  }

  if (difficulty !== undefined) {
    filtered = filtered.filter((m) => m.difficulty >= difficulty);
  }

  if (sourceType) {
    filtered = filtered.filter((m) => (m.sourceType || 'rhythia') === sourceType);
  }

  // Sort maps
  switch (sort) {
    case 'most_downloaded':
      filtered.sort((a, b) => b.downloadCount - a.downloadCount);
      break;
    case 'weekly':
      filtered.sort((a, b) => b.weeklyDownloadCount - a.weeklyDownloadCount);
      break;
    case 'top_rated':
      filtered.sort((a, b) => b.ratingAvg - a.ratingAvg);
      break;
    default: // latest
      filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  const total = filtered.length;
  const paginatedMaps = filtered.slice(offset, offset + limit);

  const mapsWithUploader = await Promise.all(
    paginatedMaps.map(async (m) => ({
      ...m,
      sourceType: m.sourceType || 'rhythia',
      tags: m.tags ? JSON.parse(m.tags) : [],
      uploader: await getUploaderInfo(m.uploaderId, m.mapper),
    }))
  );

  return {
    maps: mapsWithUploader,
    total,
  };
};

export const updateMap = async (
  id: number,
  uploaderId: number,
  data: any
): Promise<Map | null> => {
  const map = maps.find((m) => m.id === id);

  if (!map || map.uploaderId !== uploaderId) {
    throw new Error('Unauthorized or map not found');
  }

  Object.assign(map, data, { updatedAt: new Date() });
  return map as Map;
};

export const deleteMap = async (id: number, uploaderId: number): Promise<void> => {
  const index = maps.findIndex((m) => m.id === id);

  if (index === -1) {
    throw new Error('Map not found');
  }

  const map = maps[index];
  if (map.uploaderId !== uploaderId) {
    throw new Error('Unauthorized');
  }

  maps.splice(index, 1);
};

export const incrementDownloadCount = async (mapId: number): Promise<void> => {
  const map = maps.find((m) => m.id === mapId);
  if (map) {
    map.downloadCount += 1;
    map.weeklyDownloadCount += 1;
  }
};

export const updateRatingStats = async (
  mapId: number,
  ratingAvg: number,
  ratingCount: number
): Promise<void> => {
  const map = maps.find((m) => m.id === mapId);
  if (!map) return;

  map.ratingAvg = ratingAvg;
  map.ratingCount = ratingCount;
  map.updatedAt = new Date();
};

export const resetWeeklyDownloadCount = async (): Promise<void> => {
  maps.forEach((m) => {
    m.weeklyDownloadCount = 0;
  });
};

export const getPopularMaps = async (limit = 10) => {
  const sorted = [...maps].sort((a, b) => b.downloadCount - a.downloadCount);
  return Promise.all(
    sorted.slice(0, limit).map(async (m) => ({
      ...m,
      uploader: await getUploaderInfo(m.uploaderId, m.mapper),
    }))
  );
};

export const getRecentMaps = async (limit = 10) => {
  const sorted = [...maps].sort((a, b) => b.createdAt - a.createdAt);
  return Promise.all(
    sorted.slice(0, limit).map(async (m) => ({
      ...m,
      uploader: await getUploaderInfo(m.uploaderId, m.mapper),
    }))
  );
};
