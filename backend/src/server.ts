import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase, getDatabase } from './database/sqlite';
import { createTables } from './database/migrate';

// Import routes
import projectRoutes from './routes/projects';
import noteRoutes from './routes/notes';
import todoRoutes from './routes/todos';
import llmRoutes from './routes/llm';
import reportRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import timelineRoutes from './routes/timelines';

// Import services
import schedulerService from './services/scheduler';
import settingsService from './services/settings';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3060', 10);

// Initialize SQLite database
const db = initializeDatabase();
export { db as pool }; // Export as 'pool' to maintain compatibility with existing routes

// Middleware
app.use(helmet());

// CORS configuration - more permissive for internal networks (Tailscale)
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost and development URLs
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'https://tracker.evosgpt.eu',
      'http://localhost:8080',
      'http://localhost:3000',
      'https://tracker.evosgpt.eu'
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow private IP ranges, Tailscale IP ranges, and Tailscale ts.net domains
    const url = new URL(origin);
    const hostname = url.hostname;
    
    // Check for private IP ranges and Tailscale
    if (
      hostname.match(/^127\./) ||                    // localhost
      hostname.match(/^10\./) ||                     // 10.x.x.x private range
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||  // 172.16.x.x - 172.31.x.x private range
      hostname.match(/^192\.168\./) ||               // 192.168.x.x private range
      hostname.match(/^100\./) ||                    // Tailscale CGNAT range (100.x.x.x)
      hostname.match(/^fd[0-9a-f]{2}:/) ||           // Tailscale IPv6 range
      hostname.endsWith('.ts.net')                   // Tailscale HTTPS domain
    ) {
      return callback(null, true);
    }
    
    // Reject other origins
    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/timelines', timelineRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on 0.0.0.0:${PORT}`);
  console.log(`📊 Progress Tracker Backend for Tim Verhoogt @ Evos Amsterdam`);
  
  // Ensure tables exist (idempotent)
  try {
    await createTables();
  } catch (error) {
    console.error('Failed to create database tables:', error);
  }

  // Initialize settings defaults
  try {
    await settingsService.initializeDefaults();
    console.log(`⚙️ Settings initialized`);
  } catch (error) {
    console.error('Failed to initialize settings:', error);
  }
  
  // Initialize scheduler
  try {
    const schedulerStatus = await schedulerService.getStatus();
    if (schedulerStatus.isRunning) {
      console.log(`📅 Weekly reports scheduled: ${schedulerStatus.cronPattern}`);
      console.log(`⏰ Next report: ${schedulerStatus.nextRun?.toLocaleString() || 'Not scheduled'}`);
    } else {
      console.log(`📅 Weekly reports are disabled`);
    }
  } catch (error) {
    console.error('Failed to get scheduler status:', error);
  }
});

export default app;
