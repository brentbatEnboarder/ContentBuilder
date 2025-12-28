import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Routes
import scrapeRoutes from './routes/scrape';
import generateRoutes from './routes/generate';
import transcribeRoutes from './routes/transcribe';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Security & middleware
app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'ContentBuilder API',
    version: '1.0.0',
    endpoints: ['/api/health', '/api/scrape', '/api/generate', '/api/transcribe', '/api/export'],
  });
});

// API Routes
app.use('/api/scrape', scrapeRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/transcribe', transcribeRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 ContentBuilder API running on http://localhost:${PORT}`);
});

export default app;
