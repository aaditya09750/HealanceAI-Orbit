// Load env vars FIRST — must happen before any other module that reads
// process.env at import time (e.g. uploadMiddleware → cloudinary.config()).
// ES modules hoist all imports, so the only reliable way is dotenv/config.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import riskRoutes from './routes/riskRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import bodyExplorerRoutes from './routes/bodyExplorerRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import walkEarnRoutes from './routes/walkEarnRoutes.js';
import forecastRoutes from './routes/forecastRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import smsRoutes from './routes/smsRoutes.js';
import predictRoutes from './routes/predictRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const app = express();

// Connect to MongoDB
connectDB();

// ==================== MIDDLEWARE ====================

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalhostDevOrigin = /^http:\/\/localhost:\d+$/.test(origin || '');
      if (!origin || allowedOrigins.includes(origin) || isLocalhostDevOrigin) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Rate limiting
// Keep a lenient global cap so normal app polling/refresh traffic does not get blocked.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.API_RATE_LIMIT_MAX || 1200),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Keep stricter limits on abuse-prone auth endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication requests, please try again later.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ==================== ROUTES ====================

app.get('/api/health', (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  if (!mongoOk) {
    return res.status(503).json({ status: 'DEGRADED', mongo: 'disconnected' });
  }
  res.json({ status: 'OK', mongo: 'connected', message: 'Healance AI Backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/health-data', healthRoutes);
app.use('/api/risk-prediction', riskRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/body-explorer', bodyExplorerRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/walk-earn', walkEarnRoutes);
app.use('/api/walkearn', walkEarnRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ==================== ERROR HANDLING ====================

app.use(notFound);
app.use(errorHandler);

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\nHealance AI backend running on port ${PORT}...`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the old backend process and restart.`);
    process.exit(1);
  }

  throw error;
});

export default app;
