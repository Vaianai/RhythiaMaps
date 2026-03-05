import React from 'react';
import { motion } from 'framer-motion';

interface HeroProps {
  onSearchChange?: (query: string) => void;
  onSortChange?: (sort: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSearchChange, onSortChange }) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange?.(query);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-900/30 via-purple-900/25 to-pink-900/30 p-8 sm:p-12 shadow-2xl shadow-violet-500/15"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative">
        <h1 className="text-center text-4xl font-bold sm:text-5xl">
          <span className="gradient-text">Discover & Share</span>
          <br />
          <span className="text-gray-50">Rhythm Game Maps</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-center text-gray-400">
          Explore thousands of community-created maps, download your favorites, and share your own creations with the world.
        </p>

        {/* Search Bar */}
        <div className="mt-8 flex flex-col gap-4 max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title, artist, or mapper..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full rounded-xl bg-gray-900/85 border border-violet-500/30 px-4 py-3 text-gray-50 placeholder-gray-500 focus:border-violet-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Sort Options */}
          <div className="flex flex-wrap gap-2 justify-center">
            {(['latest', 'most_downloaded', 'weekly', 'top_rated'] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => onSortChange?.(sort)}
                className="px-4 py-2 rounded-lg bg-gray-800/80 hover:bg-violet-600 text-gray-300 hover:text-white border border-gray-700/60 hover:border-violet-400 transition-all text-sm font-medium"
              >
                {sort === 'latest' && 'Latest'}
                {sort === 'most_downloaded' && 'Most Downloaded'}
                {sort === 'weekly' && 'Weekly Trending'}
                {sort === 'top_rated' && 'Top Rated'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
