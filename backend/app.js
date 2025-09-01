import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { PORT, NODE_ENV } from './config/env.js';

import userRouter from './routes/user.routes.js';
import authRouter from './routes/auth.routes.js';
import adminRouter from './routes/admin.routes.js';
import healthRouter from './routes/health.routes.js';
import leagueRouter from './routes/league.routes.js';
import seasonRouter from './routes/season.routes.js';
import clubRouter from './routes/club.routes.js';
import playerRouter from './routes/player.routes.js';
import seasonManagementRouter from './routes/seasonManagement.routes.js';

import publicRouter from './routes/public.routes.js';
import connectToDatabase from './database/mongodb.js'
import errorMiddleware from './middlewares/error.middleware.js'

const app = express();

// Development-specific middleware
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });
}

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:4173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); 

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/health', healthRouter);

// Admin-only routes (require authentication and admin role)
app.use('/api/v1/admin/leagues', leagueRouter);
app.use('/api/v1/admin/seasons', seasonRouter);
app.use('/api/v1/admin/clubs', clubRouter);
app.use('/api/v1/admin/players', playerRouter);
app.use('/api/v1/admin/season-management', seasonManagementRouter);

// Public routes (no authentication required)
app.use('/api/v1/public', publicRouter);

app.use(errorMiddleware);

app.get('/', (req, res) => {
  res.send('Welcome to the Xblade API!');
});

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:4173'],
    credentials: true
  }
});

// Expose io instance to routes/controllers via app
app.set('io', io);

io.on('connection', (socket) => {
  // Join/leave season rooms for targeted broadcasts
  socket.on('season:join', (seasonId) => {
    if (seasonId) socket.join(`season:${seasonId}`);
  });

  socket.on('season:leave', (seasonId) => {
    if (seasonId) socket.leave(`season:${seasonId}`);
  });
});

server.listen(PORT, async () => {
  console.log(`Xblade API is running on http://localhost:${PORT} in ${NODE_ENV} mode`);
  await connectToDatabase();
});

export default app;