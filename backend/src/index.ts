import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import mapRoutes from './routes/mapRoutes';
import downloadRatingRoutes from './routes/downloadRatingRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// JSON parser che skippa multipart/form-data (per upload file)
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res: any, buf: any, encoding: any) => {
    // Log per debugging
    console.log('Content-Type:', req.get('content-type'));
  }
}));
app.use((req, res, next) => {
  const contentType = req.get('content-type');
  if (contentType && contentType.includes('multipart/form-data')) {
    console.log('🔄 Skipping JSON parser for multipart/form-data');
  }
  next();
});
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Local static storage fallback (used when S3 credentials are unavailable)
app.use('/storage', express.static(path.join(process.cwd(), 'storage')));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Rhythia Maps API is running!' });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/maps', mapRoutes);
app.use('/', downloadRatingRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response) => {
  console.error(err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📝 API Health: http://localhost:${PORT}/health`);
      console.log(`🌐 Frontend: http://localhost:5173`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✅ Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n✅ Shutting down gracefully...');
  process.exit(0);
});

startServer();

