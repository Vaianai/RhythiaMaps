import AWS from 'aws-sdk';
import { promises as fs } from 'fs';
import path from 'path';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_S3_ENDPOINT,
});

const isMissingCredentialsError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const awsError = error as { code?: string; message?: string };
  return (
    awsError.code === 'CredentialsError' ||
    awsError.code === 'UnknownEndpoint' ||
    (awsError.message?.toLowerCase().includes('missing credentials') ?? false)
  );
};

const getFallbackMapUrl = (filename: string): string => {
  const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${baseUrl}/storage/maps/${filename}`;
};

const getFallbackCoverUrl = (filename: string): string => {
  const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${baseUrl}/storage/covers/${filename}`;
};

const ensureStorageDir = async (dirName: 'maps' | 'covers') => {
  const dirPath = path.join(process.cwd(), 'storage', dirName);
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
};

const sanitizeFilename = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_');

export const uploadToS3 = async (
  fileBuffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> => {
  const safeFilename = sanitizeFilename(`${Date.now()}-${filename}`);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET || 'rhythia-maps',
    Key: `maps/${safeFilename}`,
    Body: fileBuffer,
    ContentType: contentType,
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    if (isMissingCredentialsError(error)) {
      console.warn('⚠️ S3 credentials missing - using local fallback for map file URL');
      const storageDir = await ensureStorageDir('maps');
      const filePath = path.join(storageDir, safeFilename);
      await fs.writeFile(filePath, fileBuffer.toString('base64'), { encoding: 'base64' });
      return getFallbackMapUrl(safeFilename);
    }
    throw error;
  }
};

export const uploadCoverToS3 = async (
  fileBuffer: Buffer,
  mapId: number
): Promise<string> => {
  const filename = sanitizeFilename(`${mapId}-${Date.now()}.jpg`);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET || 'rhythia-maps',
    Key: `covers/${filename}`,
    Body: fileBuffer,
    ContentType: 'image/jpeg',
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    if (isMissingCredentialsError(error)) {
      console.warn('⚠️ S3 credentials missing - using local fallback for cover image');
      const storageDir = await ensureStorageDir('covers');
      const filePath = path.join(storageDir, filename);
      await fs.writeFile(filePath, fileBuffer.toString('base64'), { encoding: 'base64' });
      return getFallbackCoverUrl(filename);
    }
    throw error;
  }
};

export const deleteFromS3 = async (s3Url: string): Promise<void> => {
  try {
    if (!s3Url.startsWith('http://') && !s3Url.startsWith('https://')) {
      return;
    }

    const isLocalStorageUrl = s3Url.includes('/storage/maps/') || s3Url.includes('/storage/covers/');
    if (isLocalStorageUrl) {
      try {
        const url = new URL(s3Url);
        const relativePath = url.pathname.replace(/^\/storage\//, '');
        const filePath = path.join(process.cwd(), 'storage', relativePath);
        await fs.unlink(filePath);
      } catch {
        // ignore local file deletion errors
      }
      return;
    }

    const url = new URL(s3Url);
    const key = url.pathname.substring(1);
    
    await s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET || 'rhythia-maps',
      Key: key,
    }).promise();
  } catch (error) {
    console.error('Error deleting from S3:', error);
  }
};
