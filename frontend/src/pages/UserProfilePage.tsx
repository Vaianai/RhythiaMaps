import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../context/authStore';
import type { Map } from '../context/mapStore';
import { getDifficultyLabel, getDifficultyBadgeClass } from '../utils/difficulty';

const accentOptions = ['violet', 'blue', 'emerald', 'rose'] as const;
type Accent = (typeof accentOptions)[number];

interface ProfileCustomData {
  bio: string;
  accent: Accent;
}

const getAccentClass = (accent: Accent) => {
  switch (accent) {
    case 'blue':
      return 'from-blue-600/20 to-cyan-600/20 border-blue-500/30';
    case 'emerald':
      return 'from-emerald-600/20 to-teal-600/20 border-emerald-500/30';
    case 'rose':
      return 'from-rose-600/20 to-pink-600/20 border-rose-500/30';
    default:
      return 'from-violet-600/20 to-purple-600/20 border-violet-500/30';
  }
};

export const UserProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [maps, setMaps] = useState<Map[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [customData, setCustomData] = useState<ProfileCustomData>({ bio: '', accent: 'violet' });

  const viewedUserId = id ? Number(id) : user?.id;
  const isOwnProfile = Boolean(user && viewedUserId === user.id);

  const profileStorageKey = useMemo(() => `profile-custom-${viewedUserId ?? 'unknown'}`, [viewedUserId]);

  useEffect(() => {
    if (!viewedUserId) {
      setError('User not found');
      setIsLoading(false);
      return;
    }

    const stored = localStorage.getItem(profileStorageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ProfileCustomData;
        setCustomData({
          bio: parsed.bio || '',
          accent: accentOptions.includes(parsed.accent) ? parsed.accent : 'violet',
        });
      } catch {
        setCustomData({ bio: '', accent: 'violet' });
      }
    }

    const loadMaps = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getMaps({ page: 1, limit: 100, sort: 'latest' });
        const userMaps = (response.data.maps as Map[]).filter((map) => map.uploader?.id === viewedUserId);
        setMaps(userMaps);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadMaps();
  }, [viewedUserId, profileStorageKey]);

  const username = maps[0]?.uploader?.username || (isOwnProfile ? user?.username : `User ${viewedUserId}`);

  const saveCustomizations = () => {
    localStorage.setItem(profileStorageKey, JSON.stringify(customData));
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] px-4 py-12 bg-gradient-to-b from-gray-950 via-gray-950 to-violet-950/10">
        <div className="mx-auto max-w-5xl">
          <div className="h-56 rounded-3xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 animate-pulse border border-violet-500/20" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <p className="text-gray-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] relative overflow-hidden px-4 py-10 bg-gradient-to-b from-gray-950 via-gray-950 to-violet-950/10">
      <div className="fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-950 to-violet-950/20" />
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="mx-auto max-w-5xl space-y-8">
        <div className={`rounded-3xl border p-8 backdrop-blur-sm shadow-2xl ${getAccentClass(customData.accent)}`}>
          <h1 className="text-3xl font-bold text-white">{username}</h1>
          <p className="text-sm text-gray-300 mt-2 uppercase tracking-wider">Creator profile</p>
          {customData.bio && <p className="text-gray-200 mt-4">{customData.bio}</p>}
        </div>

        {isOwnProfile && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-pink-500/20 opacity-40 blur-xl" />
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-gray-950/80 to-gray-900/80 p-6 space-y-4 shadow-2xl shadow-purple-500/10">
              <h2 className="text-lg font-semibold text-white">Customize profile</h2>
            <textarea
              value={customData.bio}
              onChange={(e) => setCustomData((prev) => ({ ...prev, bio: e.target.value }))}
              maxLength={240}
              placeholder="Write a short bio..."
              className="w-full rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-2 border-violet-500/20 px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500/80"
            />
            <div className="flex flex-wrap gap-2">
              {accentOptions.map((accent) => (
                <button
                  key={accent}
                  type="button"
                  onClick={() => setCustomData((prev) => ({ ...prev, accent }))}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${customData.accent === accent ? 'border-white text-white bg-white/10' : 'border-gray-600 text-gray-300 hover:border-violet-500/70'}`}
                >
                  {accent}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={saveCustomizations}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium"
            >
              Save Profile
            </button>
            </div>
          </motion.div>
        )}

        <section>
          <h2 className="text-2xl font-black bg-gradient-to-r from-violet-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-4">Maps by {username}</h2>
          {maps.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-gray-400">No maps yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {maps.map((map) => {
                const difficultyLabel = getDifficultyLabel(map);
                return (
                  <button
                    key={map.id}
                    onClick={() => navigate(`/map/${map.id}`)}
                    className="text-left rounded-2xl border border-gray-700/60 bg-gradient-to-b from-gray-800/60 to-gray-900/80 overflow-hidden hover:border-violet-500/60 transition-all hover:shadow-xl hover:shadow-violet-500/20"
                  >
                    <div
                      className="h-36 bg-gray-800"
                      style={{
                        backgroundImage: map.coverUrl ? `url(${map.coverUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-white truncate">{map.title}</h3>
                      <p className="text-sm text-gray-300 truncate">{map.artist}</p>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getDifficultyBadgeClass(difficultyLabel)}`}>
                          {difficultyLabel}
                        </span>
                        <span className="text-xs text-gray-400">📥 {map.downloadCount}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserProfilePage;
