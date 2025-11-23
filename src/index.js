import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import priceRoutes from './routes/prices.js';
import uploadRoutes from './routes/uploads.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import imageRoutes from './routes/images.js';
import itemRoutes from './routes/items.js';
import paymentRoutes from './routes/payments.js';
import invoiceRoutes from './routes/invoices.js';

dotenv.config();

if (process.env.DISABLE_PRICE_CRON !== 'true') {
  await import('./cron/updatePrices.js');
}

const app = express();

const allowed = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // allow configured list or any localhost (dev convenience)
    const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
    if (allowed.includes(origin) || isLocalhost) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'sonaura-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on :${port}`);
});


