import React from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiStar } from 'react-icons/fi';
import type { Map } from '../context/mapStore';

interface MapCardProps {
  map: Map;
  onClick?: (map: Map) => void;
}

// Mappa colori per difficoltà basata su tag o numero
const getDifficultyColorClass = (map: Map): string => {
  // Se ci sono tag, usa il primo tag come difficoltà
  if (map.tags) {
    try {
      const tags = typeof map.tags === 'string' ? JSON.parse(map.tags) : map.tags;
      const difficultyTag = Array.isArray(tags) ? tags[0] : null;
      
      switch (difficultyTag) {
        case 'Easy':
          return 'bg-gradient-to-r from-green-600 to-emerald-600';
        case 'Medium':
          return 'bg-gradient-to-r from-yellow-600 to-amber-600';
        case 'Hard':
          return 'bg-gradient-to-r from-red-600 to-orange-600';
        case 'Logic':
          return 'bg-gradient-to-r from-purple-700 to-violet-700';
        case 'Brrr':
          return 'bg-gradient-to-r from-gray-100 to-white';
      }
    } catch {}
  }

  // Fallback: basato su numero di difficoltà
  const difficulty = typeof map.difficulty === 'number' ? map.difficulty : parseFloat(map.difficulty);
  if (difficulty < 3) return 'bg-gradient-to-r from-green-600 to-emerald-600';
  if (difficulty < 5) return 'bg-gradient-to-r from-yellow-600 to-amber-600';
  if (difficulty < 7) return 'bg-gradient-to-r from-red-600 to-orange-600';
  if (difficulty < 8.5) return 'bg-gradient-to-r from-purple-700 to-violet-700';
  return 'bg-gradient-to-r from-gray-100 to-white';
};

const getDifficultyLabel = (map: Map): string => {
  // Se ci sono tag, usa il primo tag
  if (map.tags) {
    try {
      const tags = typeof map.tags === 'string' ? JSON.parse(map.tags) : map.tags;
      if (Array.isArray(tags) && tags.length > 0) {
        return tags[0];
      }
    } catch {}
  }

  // Fallback: basato su numero di difficoltà
  const difficulty = typeof map.difficulty === 'number' ? map.difficulty : parseFloat(map.difficulty);
  if (difficulty < 3) return 'Easy';
  if (difficulty < 5) return 'Medium';
  if (difficulty < 7) return 'Hard';
  if (difficulty < 8.5) return 'Logic';
  return 'Brrr';
};

export const MapCard: React.FC<MapCardProps> = ({ map, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick?.(map)}
      className="group cursor-pointer"
    >
      <div className="card relative overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-violet-900 to-purple-900">
          <img
            src={map.coverUrl}
            alt={map.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />

          {/* Difficulty Badge */}
          <div className={`absolute top-3 right-3 rounded-lg ${getDifficultyColorClass(map)} px-3 py-1 text-sm font-bold text-white shadow-lg`}>
            {getDifficultyLabel(map)}
          </div>

          {/* Overlay Info */}
          <div className="absolute inset-0 flex items-end opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="w-full bg-gradient-to-t from-black/90 to-transparent p-4">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span className="flex items-center gap-1">
                  <FiDownload className="h-4 w-4" />
                  {map.downloadCount}
                </span>
                <span className="flex items-center gap-1">
                  <FiStar className="h-4 w-4" />
                  {map.ratingAvg.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4">
          <h3 className="truncate font-semibold text-gray-50 line-clamp-2">
            {map.title}
          </h3>
          <p className="mt-1 truncate text-sm text-gray-400">{map.artist}</p>
          <p className="truncate text-sm text-gray-500">by {map.mapper}</p>

          {/* Stats */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>{(map.duration / 1000).toFixed(1)}s</span>
            <span>{map.noteCount} notes</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
