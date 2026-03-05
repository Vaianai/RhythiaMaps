import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiDownload, FiStar } from 'react-icons/fi';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../context/authStore';
import type { Map } from '../context/mapStore';
import { getDifficultyLabel } from '../utils/difficulty';

export const MapDetailPage: React.FC = () => {
  const { id } = useParams();
  const [map, setMap] = useState<Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [ratings, setRatings] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [coverLoadFailed, setCoverLoadFailed] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const loadMap = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getMap(parseInt(id!));
        setMap(response.data);
        setCoverLoadFailed(false);

        // Load ratings
        const ratingsResponse = await apiClient.getMapRatings(parseInt(id!));
        setRatings(ratingsResponse.data.ratings);

        // Load user's rating if authenticated
        if (user) {
          try {
            const userRatingResponse = await apiClient.getUserRating(parseInt(id!));
            setUserRating(userRatingResponse.data.rating);
            setComment(userRatingResponse.data.comment || '');
          } catch (err) {
            // User hasn't rated yet
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();
  }, [id, user]);

  const handleRateMap = async (rating: number) => {
    if (!user) {
      alert('Please login to rate maps');
      return;
    }

    try {
      if (userRating) {
        await apiClient.updateRating(parseInt(id!), { rating, comment });
      } else {
        await apiClient.createRating(parseInt(id!), { rating, comment });
      }
      setUserRating(rating);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to rate map');
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;

    try {
      setIsDownloading(true);

      const response = await apiClient.downloadMap(parseInt(id!));
      setMap((prev) => (prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : prev));

      const downloadUrl = response.data?.downloadUrl as string | undefined;

      if (downloadUrl) {
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = '';
        downloadLink.target = '_blank';
        downloadLink.rel = 'noopener noreferrer';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    } catch (err) {
      setError('Failed to download map');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[calc(100vh-64px)] px-4 py-12"
      >
        <div className="mx-auto max-w-4xl">
          <div className="card h-96 animate-pulse" />
        </div>
      </motion.div>
    );
  }

  if (error || !map) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl text-gray-400">{error || 'Map not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-64px)] px-4 py-12"
    >
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              {/* Cover */}
              <div className="relative h-64 bg-gradient-to-br from-violet-900 to-purple-900">
                {!coverLoadFailed && map.coverUrl ? (
                  <img
                    src={map.coverUrl}
                    alt={map.title}
                    onError={() => setCoverLoadFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-violet-900/70 to-purple-900/70 text-violet-200">
                    <div className="text-center">
                      <div className="text-5xl mb-2">🎵</div>
                      <p className="text-sm font-medium px-4 truncate max-w-xs">{map.title}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{map.title}</h1>
                    <p className="text-lg text-gray-400">{map.artist}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-violet-400">
                      {getDifficultyLabel(map)}
                    </div>
                    <p className="text-sm text-gray-500">Difficulty</p>
                  </div>
                </div>

                {/* Description */}
                {map.description && (
                  <div className="mb-6 pb-6 border-b border-gray-800">
                    <p className="text-gray-300">{map.description}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="card-bg bg-gray-800/50 p-3">
                    <p className="text-2xl font-bold text-violet-400">{map.downloadCount}</p>
                    <p className="text-xs text-gray-500">Downloads</p>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full btn btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FiDownload className={isDownloading ? 'animate-bounce' : ''} />
                  {isDownloading ? 'Downloading...' : 'Download Map'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Rating</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold mb-1 gradient-text">
                  {map.ratingAvg.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                  <FiStar /> {map.ratingCount} ratings
                </div>
              </div>

              {user && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">Your Rating</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRateMap(star)}
                        className={`flex-1 py-2 rounded transition-colors ${
                          userRating === star
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                        }`}
                      >
                        {star}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Creator */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Creator</h3>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => navigate(`/user/${map.uploader.id}`)}
                  className="font-medium text-violet-300 hover:text-violet-200"
                >
                  {map.uploader.username}
                </button>
                <p className="text-sm text-gray-500 mt-1">
                  Uploaded on {new Date(map.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Community Ratings</h2>
          <div className="space-y-4">
            {ratings.map((rating) => (
              <div key={rating.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{rating.user.username}</p>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FiStar
                          key={i}
                          className={i < rating.rating ? 'fill-yellow-400' : ''}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(rating.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {rating.comment && (
                  <p className="text-gray-400 text-sm mt-2">{rating.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
