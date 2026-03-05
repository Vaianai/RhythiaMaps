// Mock database in-memory per development

const createCoverDataUrl = (title: string, bg = '#1f2937', accent = '#8b5cf6') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="${bg}"/><rect x="12" y="12" width="276" height="276" fill="none" stroke="${accent}" stroke-width="2" rx="12"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Segoe UI, Arial" font-size="20" fill="#e5e7eb">${title}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// Simulazione di dati
export const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    passwordHash: '$2a$10$xKe5sSryhX8zK4EzF0ZXKOTKd5iqr8Cv0YBKRvJQXn8u6.tKXR5RO', // admin123
    role: 'ADMIN' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: '$2a$10$xKe5sSryhX8zK4EzF0ZXKOTKd5iqr8Cv0YBKRvJQXn8u6.tKXR5RO', // admin123
    role: 'USER' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockMaps: any[] = [];
