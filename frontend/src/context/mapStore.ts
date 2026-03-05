import { create } from 'zustand';

export interface Map {
  id: number;
  title: string;
  artist: string;
  mapper: string;
  sourceType?: 'rhythia' | 'soundspace';
  difficulty: number;
  description?: string;
  duration: number;
  bpm?: number;
  noteCount: number;
  fileUrl: string;
  coverUrl: string;
  downloadCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  ranked?: boolean;
  tags?: string[];
  uploader: {
    id: number;
    username: string;
  };
}

interface MapStore {
  maps: Map[];
  selectedMap: Map | null;
  isLoading: boolean;
  error: string | null;
  setMaps: (maps: Map[]) => void;
  setSelectedMap: (map: Map | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  maps: [],
  selectedMap: null,
  isLoading: false,
  error: null,
  setMaps: (maps) => set({ maps }),
  setSelectedMap: (selectedMap) => set({ selectedMap }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
