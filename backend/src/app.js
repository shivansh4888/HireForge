import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';

import uploadRouter from './routes/upload.js';
import jobsRouter   from './routes/jobs.js';
import authRouter   from './routes/auth.js';

const app        = express();
const httpServer = createServer(app);

// ── WebSocket ─────────────────────────────────────────────────────────────────
const wss     = new WebSocketServer({ server: httpServer });
const clients = new Map();   // jobId → ws

wss.on('connection', (ws, req) => {
  const jobId = new URL(req.url, 'http://x').searchParams.get('jobId');
  if (jobId) {
    clients.set(jobId, ws);
    console.log(`WS connected: ${jobId}`);
  }
  ws.on('close', () => clients.delete(jobId));
  ws.on('error', (e) => console.error('WS error', e));
});

export const pushProgress = (jobId, payload) => {
  const ws = clients.get(jobId);
  if (ws?.readyState === 1) ws.send(JSON.stringify(payload));
};

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',   authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/jobs',   jobsRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

// ── DB + Start ────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    httpServer.listen(3001, () => console.log('Backend on http://localhost:3001'));
  })
  .catch(err => { console.error(err); process.exit(1); });