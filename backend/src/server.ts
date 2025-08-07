import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase, getDatabase } from './database/sqlite';

// Import routes
import projectRoutes from './routes/projects';
import noteRoutes from './routes/notes';
import todoRoutes from './routes/todos';
import llmRoutes from './routes/llm';
import reportRoutes from './routes/reports';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3060;

// Initialize SQLite database
const db = initializeDatabase();
export { db as pool }; // Export as 'pool' to maintain compatibility with existing routes

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://tracker.evosgpt.eu',
    'http://localhost:8080',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/reports', reportRoutes);

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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Progress Tracker Backend for Tim Verhoogt @ Evos Amsterdam`);
});

export default app;
