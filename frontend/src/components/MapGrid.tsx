import React, { useState, useEffect } from 'react';
import { MapCard } from './MapCard';
import type { Map } from '../context/mapStore';

interface MapGridProps {
  maps: Map[];
  isLoading?: boolean;
  onMapClick?: (map: Map) => void;
}

export const MapGrid: React.FC<MapGridProps> = ({ maps, isLoading, onMapClick }) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!maps.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg bg-gray-900/50 py-16 text-center">
        <p className="text-lg text-gray-400">No maps found</p>
        <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {maps.map((map) => (
        <MapCard key={map.id} map={map} onClick={onMapClick} />
      ))}
    </div>
  );
};
