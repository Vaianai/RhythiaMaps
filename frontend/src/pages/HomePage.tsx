import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../context/authStore';
import { Hero } from '../components/Hero';
import type { Map } from '../context/mapStore';
import { getDifficultyBadgeClass, getDifficultyBorderClass, getDifficultyLabel } from '../utils/difficulty';

interface DifficultyFilter {
  label: string;
  color: string;
}

const DIFFICULTY_FILTERS: Record<string, DifficultyFilter> = {
  any: { label: 'Any Maps', color: 'from-purple-600 to-purple-800' },
  easy: { label: 'Easy', color: 'from-green-600 to-emerald-700' },
  medium: { label: 'Medium', color: 'from-yellow-600 to-amber-700' },
  hard: { label: 'Hard', color: 'from-red-600 to-rose-700' },
  logic: { label: 'Logic', color: 'from-violet-600 to-purple-700' },
  brrr: { label: 'Brrr', color: 'from-gray-100 to-white' },
};

const UPLOAD_TAG_OPTIONS = ['Visual', 'Tech', 'Jumps', 'Streams'];

export const HomePage: React.FC = () => {
  const [maps, setMaps] = useState<Map[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<'latest' | 'most_downloaded' | 'weekly' | 'top_rated'>('latest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedGame, setSelectedGame] = useState<'rhythia' | 'soundspace'>('rhythia');
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [authorFilter, setAuthorFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const tagMenuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node)) {
        setIsTagMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDifficulty = (key: string) => {
    if (key === 'any') {
      setSelectedDifficulties([]);
      setPage(1);
      return;
    }

    setSelectedDifficulties((prev) => {
      const next = prev.includes(key)
        ? prev.filter((item) => item !== key)
        : [...prev, key];
      return next;
    });
    setPage(1);
  };

  useEffect(() => {
    const loadMaps = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getMaps({
          sort,
          search: search || undefined,
          sourceType: selectedGame,
          page,
          limit: 50, // 5 colonne x 10 righe
        });
        
        // Applica i filtri avanzati localmente
        let filtered = response.data.maps;
        
        if (authorFilter) {
          filtered = filtered.filter((map: Map) =>
            map.uploader?.username.toLowerCase().includes(authorFilter.toLowerCase())
          );
        }
        
        if (tagFilter) {
          filtered = filtered.filter((map: Map) => {
            const tags = map.tags || [];
            return tags.some((tag: string) => 
              tag.toLowerCase().includes(tagFilter.toLowerCase())
            );
          });
        }

        if (selectedDifficulties.length > 0) {
          const selectedLabels = selectedDifficulties.map(
            (difficultyKey) => DIFFICULTY_FILTERS[difficultyKey].label.toLowerCase()
          );
          filtered = filtered.filter((map: Map) =>
            selectedLabels.includes(getDifficultyLabel(map).toLowerCase())
          );
        }

        filtered = filtered.filter((map: Map) => (map.sourceType || 'rhythia') === selectedGame);
        
        setMaps(filtered);
      } catch (err) {
        console.error('Failed to load maps:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMaps();
  }, [sort, search, page, authorFilter, tagFilter, selectedDifficulties, selectedGame]);

  const handleMapClick = (map: Map) => {
    navigate(`/map/${map.id}`);
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-950 to-violet-950/10">
      {/* Hero Section */}
      <section className="px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800">
        <div className="mx-auto max-w-7xl">
          <Hero />
        </div>
      </section>

      {/* Install Instructions */}
      <section className="px-4 py-6 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-900/20 to-purple-900/20 border-b border-violet-700/30">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-3xl"
            >
              🎵
            </motion.div>
            <div>
              <h3 className="font-bold text-white text-lg">How to Install Maps</h3>
              <p className="text-sm text-gray-300">Download maps from the website or in-game, then drag the downloaded file onto the game window to install.</p>
            </div>
          </div>
          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/upload')}
              className="whitespace-nowrap px-6 py-3 bg-gradient-to-r from-violet-600 to-red-600 hover:from-violet-500 hover:to-red-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
            >
              🚀 Upload your map
            </motion.button>
          )}
        </div>
      </section>

      {/* Game Selection - Large Hero */}
      {!selectedGame ? (
        <section className="px-4 py-20 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 via-gray-950 to-violet-950/20 border-b border-violet-500/30">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-12"
            >
              <div>
                <motion.h1
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-6xl sm:text-7xl lg:text-8xl font-black mb-6 bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                >
                  Choose Your Game
                </motion.h1>
                <p className="text-lg text-gray-400 mb-12">Select which game's maps you want to browse</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                {[
                  { id: 'rhythia', label: 'Rhythia', emoji: '🎵', desc: 'Sync Smash' },
                  { id: 'soundspace', label: 'Sound Space', emoji: '🔊', desc: 'Beat it Out' },
                ].map((game, idx) => (
                  <motion.button
                    key={game.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.15, duration: 0.6 }}
                    whileHover={{ scale: 1.08, y: -10 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedGame(game.id as 'rhythia' | 'soundspace');
                      setPage(1);
                    }}
                    className="group relative px-8 py-12 rounded-2xl border-2 border-violet-500/30 hover:border-violet-400/60 bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/20"
                  >
                    <div className="text-5xl mb-4">{game.emoji}</div>
                    <h3 className="text-3xl font-bold text-white mb-2">{game.label}</h3>
                    <p className="text-sm text-gray-400">{game.desc}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      ) : (
        <>
          {/* Filters Section - Only show after game selected */}
          <section className="px-4 py-6 sm:px-6 lg:px-8 border-b border-violet-500/20 bg-gradient-to-b from-violet-950/15 to-transparent">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/60 to-gray-950/70 p-4 shadow-xl shadow-violet-500/10 backdrop-blur-sm">
                {/* Game Selector (Compact) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="flex flex-wrap items-center gap-3"
                >
                  <h3 className="font-bold text-white text-sm bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">🎮 Game:</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'rhythia', label: 'Rhythia' },
                      { id: 'soundspace', label: 'Sound Space' },
                    ].map((game, idx) => (
                      <motion.button
                        key={game.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedGame(game.id as 'rhythia' | 'soundspace');
                          setPage(1);
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedGame === game.id
                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 hover:border-violet-500/50'
                        }`}
                      >
                        {game.label}
                      </motion.button>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedGame(undefined as any)}
                    className="ml-auto px-3 py-2 text-sm rounded-lg bg-gray-800/50 text-gray-400 hover:text-gray-200 border border-gray-700/50 transition-all"
                  >
                    ← Back
                  </motion.button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex flex-wrap items-center gap-3"
            >
              <h3 className="font-bold text-white text-base bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">⚡ Difficulty:</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(DIFFICULTY_FILTERS).map(([key, filter], idx) => (
                  <motion.button
                    key={key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + idx * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      toggleDifficulty(key);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      (key === 'any' && selectedDifficulties.length === 0) ||
                      (key !== 'any' && selectedDifficulties.includes(key))
                        ? `bg-gradient-to-r ${filter.color} text-white shadow-lg shadow-violet-500/30`
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 hover:border-violet-500/50'
                    }`}
                  >
                    {filter.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Advanced Filters Toggle */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 rounded-lg bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 hover:border-violet-500/50 font-medium transition-all text-sm flex items-center gap-2"
            >
              ⚙️ Advanced Filters {showAdvancedFilters ? '▼' : '▶'}
            </motion.button>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 p-5 rounded-lg bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-violet-500/20 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Author Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">By Author</label>
                      <input
                        type="text"
                        placeholder="Creator name..."
                        value={authorFilter}
                        onChange={(e) => setAuthorFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>

                    {/* Tag Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Tags</label>
                      <div ref={tagMenuRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setIsTagMenuOpen((prev) => !prev)}
                          className="w-full flex items-center justify-between gap-3 pl-3 pr-3 py-2.5 rounded-xl bg-gradient-to-br from-gray-900 to-gray-950 border border-violet-500/30 text-sm shadow-lg shadow-violet-500/5 hover:border-violet-400/60 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="text-violet-300">🏷️</span>
                            <span className={`truncate ${tagFilter ? 'text-gray-100' : 'text-gray-400'}`}>
                              {tagFilter || 'All tags'}
                            </span>
                          </span>
                          <span className={`text-gray-400 transition-transform ${isTagMenuOpen ? 'rotate-180' : ''}`}>▾</span>
                        </button>

                        {isTagMenuOpen && (
                          <div className="absolute z-30 mt-2 w-full rounded-xl border border-violet-500/30 bg-gray-950/95 backdrop-blur-md shadow-2xl shadow-violet-500/20 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                setTagFilter('');
                                setIsTagMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-violet-500/10 hover:text-white transition-colors"
                            >
                              All tags (reset)
                            </button>
                            {UPLOAD_TAG_OPTIONS.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  setTagFilter(tag);
                                  setIsTagMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                                  tagFilter === tag
                                    ? 'bg-violet-500/20 text-white'
                                    : 'text-gray-200 hover:bg-violet-500/10 hover:text-white'
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-gray-700/50">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setAuthorFilter('');
                        setTagFilter('');
                      }}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 transition-colors"
                    >
                      Clear Filters
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

          {/* Maps Grid */}
          <section className="px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="flex justify-center"
                >
                  <div className="inline-block rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent"></div>
                </motion.div>
              ) : maps.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="text-5xl mb-4">🗺️</div>
                  <p className="text-gray-300 text-lg">No maps found</p>
                  <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or be the first to upload!</p>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${selectedGame}-${selectedDifficulties.join('|')}-${sort}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                  >
                    {maps.map((map, idx) => (
                      <motion.div
                        key={map.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ delay: idx * 0.03, duration: 0.3 }}
                        whileHover={{ scale: 1.08, y: -8 }}
                        onClick={() => handleMapClick(map)}
                        className={`group cursor-pointer rounded-2xl overflow-hidden bg-gradient-to-b from-gray-800/90 to-gray-900 transition-all border-2 ${getDifficultyBorderClass(getDifficultyLabel(map))} shadow-xl hover:shadow-2xl`}
                      >
                        {/* Cover Image with Info Overlay - All Inside Card */}
                        <div className="relative aspect-square overflow-hidden bg-gray-900">
                          <div className="w-full h-full bg-gradient-to-br from-violet-600/20 to-purple-600/20 flex items-center justify-center">
                            {map.coverUrl ? (
                              <>
                                <img
                                  src={map.coverUrl}
                                  alt={map.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const img = e.currentTarget;
                                    img.style.display = 'none';
                                    const fallback = img.nextElementSibling as HTMLElement | null;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden w-full h-full items-center justify-center text-center">
                                  <div>
                                    <div className="text-5xl mb-2">🎵</div>
                                    <p className="text-xs text-gray-300 px-2">{map.title}</p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-center"
                              >
                                <div className="text-5xl mb-2">🎵</div>
                                <p className="text-xs text-gray-400 px-2">{map.title}</p>
                              </motion.div>
                            )}
                          </div>

                          {/* Stats Overlay - Hidden by default, visible on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                            <div className="flex justify-between text-xs text-gray-200 font-semibold">
                              <span className="flex items-center gap-1">⭐ {map.ratingAvg?.toFixed(1) || 'N/A'}</span>
                              <span className="flex items-center gap-1">⏱️ {formatTime(map.duration)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-200 font-semibold">
                              <span className="flex items-center gap-1">🎹 {map.noteCount}</span>
                              <span className="flex items-center gap-1">📥 {map.downloadCount}</span>
                            </div>
                          </div>

                          {/* Info Section - Always Visible at Bottom */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 space-y-1 group-hover:via-black/80 transition-all">
                            <h3 className="font-bold text-xs text-white truncate group-hover:text-violet-300 transition-colors">{map.title}</h3>
                            <p className="text-xs text-gray-300 truncate">{map.artist}</p>
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${getDifficultyBadgeClass(getDifficultyLabel(map))}`}>
                                {getDifficultyLabel(map)}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/40 text-gray-200 border border-white/10">
                                {(map.sourceType || 'rhythia') === 'soundspace' ? 'Sound Space' : 'Rhythia'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (map.uploader?.id) navigate(`/user/${map.uploader.id}`);
                                }}
                                className="text-xs text-gray-200 hover:text-violet-300 truncate"
                              >
                                👤 {map.uploader?.username || 'unknown'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Pagination */}
              {!isLoading && maps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-12 flex justify-center gap-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600/50 to-purple-600/50 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 font-semibold border border-violet-500/30"
                  >
                    ← Previous
                  </motion.button>
                  <div className="px-6 py-3 rounded-lg bg-gray-800/50 text-gray-300 border border-gray-700/50 font-semibold">
                    Page {page}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(page + 1)}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 font-semibold"
                  >
                    Next →
                  </motion.button>
                </motion.div>
              )}
            </div>
          </section>
        </>
        )}
    </div>
  );
};
