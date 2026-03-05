import { Download } from '@prisma/client';
import { mapService } from './index';

// In-memory store for downloads
let downloads: any[] = [];
let nextDownloadId = 1;
const uniqueDownloadByMapAndIp = new Set<string>();
const uniqueDownloadByMapAndUser = new Set<string>();

export const recordDownload = async (
  mapId: number,
  userId?: number,
  sourceKey?: string
): Promise<Download> => {
  const map = await mapService.getMapById(mapId);
  if (!map) {
    throw new Error('Map not found');
  }

  const normalizedSourceKey = (sourceKey || 'unknown').trim();

  const duplicateByIp = uniqueDownloadByMapAndIp.has(`${mapId}:${normalizedSourceKey}`);
  const duplicateByUser = Boolean(userId) && uniqueDownloadByMapAndUser.has(`${mapId}:${userId}`);

  if (duplicateByIp || duplicateByUser) {
    return {
      id: -1,
      mapId,
      userId: userId || null,
      createdAt: new Date(),
    } as Download;
  }

  uniqueDownloadByMapAndIp.add(`${mapId}:${normalizedSourceKey}`);
  if (userId) {
    uniqueDownloadByMapAndUser.add(`${mapId}:${userId}`);
  }

  const download = {
    id: nextDownloadId++,
    mapId,
    userId: userId || null,
    createdAt: new Date(),
  };

  downloads.push(download);

  // Increment download count
  await mapService.incrementDownloadCount(mapId);

  return download as Download;
};

export const getMapDownloads = async (
  mapId: number,
  limit = 100,
  offset = 0
) => {
  const filtered = downloads.filter((d) => d.mapId === mapId);
  const total = filtered.length;
  const paginatedDownloads = filtered
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(offset, offset + limit);

  return { downloads: paginatedDownloads, total };
};

export const getUserDownloads = async (
  userId: number,
  limit = 20,
  offset = 0
) => {
  const filtered = downloads.filter((d) => d.userId === userId);
  const total = filtered.length;
  const paginatedDownloads = filtered
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(offset, offset + limit);

  return { downloads: paginatedDownloads, total };
};

export const getDownloadStats = async (mapId: number) => {
  const count = downloads.filter((d) => d.mapId === mapId).length;
  return { _count: { id: count } };
};
