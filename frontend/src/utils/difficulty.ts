import type { Map } from '../context/mapStore';

const LABELS = ['Easy', 'Medium', 'Hard', 'Logic', 'Brrr'];

const normalizeTags = (rawTags: unknown): string[] => {
  if (Array.isArray(rawTags)) {
    return rawTags.filter((tag): tag is string => typeof tag === 'string');
  }

  if (typeof rawTags === 'string') {
    try {
      const parsed = JSON.parse(rawTags);
      if (Array.isArray(parsed)) {
        return parsed.filter((tag): tag is string => typeof tag === 'string');
      }
    } catch {
      return [];
    }
  }

  return [];
};

export const getDifficultyLabel = (map: Pick<Map, 'difficulty' | 'tags'>): string => {
  const tags = normalizeTags(map.tags);
  const tagMatch = LABELS.find((label) =>
    tags.some((tag) => tag.toLowerCase() === label.toLowerCase())
  );

  if (tagMatch) return tagMatch;

  const value = Number(map.difficulty);
  if (value <= 1.5) return 'Easy';
  if (value <= 2.5) return 'Medium';
  if (value <= 3.5) return 'Hard';
  if (value <= 4.5) return 'Logic';
  return 'Brrr';
};

export const getDifficultyBadgeClass = (label: string): string => {
  switch (label) {
    case 'Easy':
      return 'bg-green-900/60 text-green-300 shadow-lg shadow-green-500/20';
    case 'Medium':
      return 'bg-yellow-900/60 text-yellow-300 shadow-lg shadow-yellow-500/20';
    case 'Hard':
      return 'bg-red-900/60 text-red-300 shadow-lg shadow-red-500/20';
    case 'Logic':
      return 'bg-violet-900/60 text-violet-300 shadow-lg shadow-violet-500/20';
    default:
      return 'bg-gray-100/90 text-gray-900 shadow-lg shadow-white/30';
  }
};

export const getDifficultyBorderClass = (label: string): string => {
  switch (label) {
    case 'Easy':
      return 'border-green-500 hover:border-green-400 shadow-green-500/20';
    case 'Medium':
      return 'border-yellow-500 hover:border-yellow-400 shadow-yellow-500/20';
    case 'Hard':
      return 'border-red-500 hover:border-red-400 shadow-red-500/20';
    case 'Logic':
      return 'border-violet-500 hover:border-violet-400 shadow-violet-500/20';
    default:
      return 'border-gray-200 hover:border-white shadow-white/20';
  }
};
