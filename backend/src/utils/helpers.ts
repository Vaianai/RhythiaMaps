import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const isValidFileExtension = (filename: string, allowed: string[]): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowed.includes(ext) : false;
};

export const getFileSizeInMB = (bytes: number): number => {
  return bytes / (1024 * 1024);
};

export const parseSSPMFile = (buffer: Buffer): any => {
  // SSPM format parsing
  // This is a placeholder - you should implement actual SSPM format parsing
  // based on the format specification
  try {
    const content = buffer.toString('utf-8');
    const lines = content.split('\n');
    const metadata: any = {};

    lines.forEach((line) => {
      if (line.includes(':')) {
        const [key, value] = line.split(':', 2);
        metadata[key.trim().toLowerCase()] = value.trim();
      }
    });

    return {
      title: metadata.title || 'Untitled',
      artist: metadata.artist || 'Unknown',
      mapper: metadata.mapper || 'Unknown',
      difficulty: parseFloat(metadata.difficulty) || 0,
      bpm: parseFloat(metadata.bpm) || null,
      duration: parseInt(metadata.duration) || 0,
      noteCount: parseInt(metadata.notecount) || 0,
    };
  } catch (error) {
    throw new Error('Failed to parse SSPM file');
  }
};

export const parseSoundSpaceTextMap = (content: string): {
  noteCount: number;
  duration: number;
} => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Sound Space text map is empty');
  }

  const chunks = trimmed.split(',').map((part) => part.trim()).filter(Boolean);
  if (chunks.length < 2) {
    throw new Error('Sound Space text map has an invalid structure');
  }

  const header = chunks[0];
  if (!/^\d+$/.test(header)) {
    throw new Error('Sound Space text map header must be a numeric id');
  }

  let minTime = Number.POSITIVE_INFINITY;
  let maxTime = Number.NEGATIVE_INFINITY;
  let noteCount = 0;

  for (let index = 1; index < chunks.length; index += 1) {
    const noteRaw = chunks[index];
    const [xRaw, yRaw, timeRaw] = noteRaw.split('|');

    if (xRaw === undefined || yRaw === undefined || timeRaw === undefined) {
      throw new Error(`Invalid note entry at index ${index}`);
    }

    const x = Number(xRaw);
    const y = Number(yRaw);
    const time = Number(timeRaw);

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(time)) {
      throw new Error(`Invalid numeric values at note index ${index}`);
    }

    minTime = Math.min(minTime, time);
    maxTime = Math.max(maxTime, time);
    noteCount += 1;
  }

  if (noteCount === 0) {
    throw new Error('Sound Space text map does not contain notes');
  }

  const duration = Math.max(1, Math.round(maxTime - minTime));

  return {
    noteCount,
    duration,
  };
};
