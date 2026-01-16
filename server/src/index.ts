import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Middleware
import { authMiddleware } from './middleware/auth';

// Routes
import scrapeRoutes from './routes/scrape';
import generateRoutes from './routes/generate';
import transcribeRoutes from './routes/transcribe';
import processRoutes from './routes/process';
import adminRoutes from './routes/admin';

// In development, load from parent .env. In production, Railway injects env vars
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../.env' });
}

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const isProduction = process.env.NODE_ENV === 'production';

// Security & middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: [
        "'self'",
        "https://qobjinzombhqfnzepgvz.supabase.co",
        "wss://qobjinzombhqfnzepgvz.supabase.co",
        "https://accounts.google.com",
        "https://www.googleapis.com",
      ],
      frameSrc: ["'self'", "https://accounts.google.com"],
      formAction: ["'self'", "https://accounts.google.com"],
    },
  } : false,
}));

// In production, allow same-origin. In dev, allow localhost frontend
const corsOrigin = isProduction ? true : FRONTEND_URL;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'ContentBuilder API',
    version: '1.0.0',
    endpoints: ['/api/health', '/api/scrape', '/api/generate', '/api/transcribe', '/api/process', '/api/export'],
  });
});

// Public image proxy (no auth required - used by <img> tags)
app.get('/api/image-proxy', async (req: Request, res: Response): Promise<void> => {
  const imageUrl = req.query.url as string;

  if (!imageUrl) {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  // Validate URL
  try {
    new URL(imageUrl);
  } catch {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  // Only allow image URLs from known sources
  const allowedDomains = [
    'imgs.search.brave.com',
    'hiclipart.com',
    'p1.hiclipart.com',
    'p7.hiclipart.com',
    'pngset.com',
    'freepnglogos.com',
    'logos-world.net',
    'upload.wikimedia.org',
    'seeklogo.com',
  ];

  try {
    const urlObj = new URL(imageUrl);
    const isAllowed = allowedDomains.some(domain =>
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );

    if (!isAllowed) {
      res.status(403).json({ error: 'Domain not allowed' });
      return;
    }
  } catch {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/*',
        'Referer': new URL(imageUrl).origin,
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Failed to fetch image: ${response.status}` });
      return;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

// API Routes (protected by auth middleware)
app.use('/api/scrape', authMiddleware, scrapeRoutes);
app.use('/api/generate', authMiddleware, generateRoutes);
app.use('/api/transcribe', authMiddleware, transcribeRoutes);
app.use('/api/process', authMiddleware, processRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

// Serve static files in production
if (isProduction) {
  const staticPath = path.join(__dirname, '../../dist');
  app.use(express.static(staticPath));

  // SPA fallback - serve index.html for all non-API routes
  // Express 5 requires named wildcard parameters
  app.use((_req: Request, res: Response) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
} else {
  // 404 handler for development (API-only)
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });
}

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 ContentBuilder API running on http://localhost:${PORT}`);
});

export default app;
