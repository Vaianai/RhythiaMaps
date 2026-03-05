import { Rating } from '@prisma/client';
import { mapService } from './index';
import { getUserById } from './userService';

// In-memory store for ratings
let ratings: any[] = [];
let nextRatingId = 1;

export const createRating = async (
  mapId: number,
  userId: number,
  rating: number,
  comment?: string
): Promise<Rating> => {
  // Check if user already rated this map
  const existingRating = ratings.find(
    (r) => r.mapId === mapId && r.userId === userId
  );

  if (existingRating) {
    throw new Error('User has already rated this map');
  }

  const newRating = {
    id: nextRatingId++,
    mapId,
    userId,
    rating,
    comment: comment || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  ratings.push(newRating);

  // Update map rating average
  await updateMapRatingAverage(mapId);

  return newRating as Rating;
};

export const updateRating = async (
  mapId: number,
  userId: number,
  rating: number,
  comment?: string
): Promise<Rating> => {
  const existing = ratings.find(
    (r) => r.mapId === mapId && r.userId === userId
  );

  if (!existing) {
    throw new Error('Rating not found');
  }

  existing.rating = rating;
  existing.comment = comment || null;
  existing.updatedAt = new Date();

  await updateMapRatingAverage(mapId);

  return existing as Rating;
};

export const deleteRating = async (
  mapId: number,
  userId: number
): Promise<void> => {
  const index = ratings.findIndex(
    (r) => r.mapId === mapId && r.userId === userId
  );

  if (index === -1) {
    throw new Error('Rating not found');
  }

  ratings.splice(index, 1);
  await updateMapRatingAverage(mapId);
};

export const getMapRatings = async (
  mapId: number,
  limit = 20,
  offset = 0
) => {
  const filtered = ratings.filter((r) => r.mapId === mapId);
  const total = filtered.length;
  const paginatedRatings = await Promise.all(
    filtered
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(offset, offset + limit)
      .map(async (r) => {
        const user = await getUserById(r.userId);
        return {
          ...r,
          user: {
            id: r.userId,
            username: user?.username || 'unknown',
          },
        };
      })
  );

  return { ratings: paginatedRatings, total };
};

export const getUserRating = async (
  mapId: number,
  userId: number
): Promise<Rating | null> => {
  const rating = ratings.find(
    (r) => r.mapId === mapId && r.userId === userId
  );
  return rating || null;
};

export const updateMapRatingAverage = async (mapId: number): Promise<void> => {
  const mapRatings = ratings.filter((r) => r.mapId === mapId);

  if (mapRatings.length === 0) {
    await mapService.updateRatingStats(mapId, 0, 0);
    return;
  }

  const avgRating =
    mapRatings.reduce((sum, r) => sum + r.rating, 0) / mapRatings.length;
  const count = mapRatings.length;

  await mapService.updateRatingStats(mapId, Math.round(avgRating * 10) / 10, count);
};
