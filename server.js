// ============================================
// TINDAHAN.AI - Unified Backend Server
// ============================================

const Replicate = require('replicate');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Services Initialization
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Replicate Initialization (Only once)
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

// ============================================
// CONFIGURATION & LIMITS
// ============================================

const PLAN_LIMITS = {
  free: { descriptions: 15, videos: 1 },
  starter: { descriptions: 200, videos: 10 }, 
  pro: { descriptions: 200, videos: 50 },
  premium: { descriptions: 999999, videos: 999999 }, // Unified "Premium" as requested
  business: { descriptions: 999999, videos: 999999 }
};

// ============================================
// MIDDLEWARE & HELPERS
// ============================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

async function checkAndIncrementUsage(userId, type) {
  const result = await pool.query(
    'SELECT plan_type, generations_today, video_generations_today, last_generation_date, last_video_date, total_video_generations FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) throw new Error('User not found');
  const user = result.rows[0];
  const today = new Date().toISOString().split('T')[0];
  
  const isVideo = type === 'videos';
  const lastDate = isVideo ? (user.last_video_date?.toISOString().split('T')[0]) : (user.last_generation_date?.toISOString().split('T')[0]);
  let countToday = isVideo ? (user.video_generations_today || 0) : (user.generations_today || 0);

  if (lastDate !== today) {
    countToday = 0;
    const resetField = isVideo ? 'video_generations_today = 0, last_video_date = CURRENT_DATE' : 'generations_today = 0, last_generation_date = CURRENT_DATE';
    await pool.query(`UPDATE users SET ${resetField} WHERE id = $1`, [userId]);
  }

  const limit = PLAN_LIMITS[user.plan_type]?.[type] || PLAN_LIMITS.free[type];

  if (user.plan_type === 'free' && isVideo && (user.total_video_generations >= 1)) {
    return { allowed: false, message: "You've used your 1 free video generation! Upgrade to Starter (₱450/month) for 10 videos/month." };
  }

  if (countToday >= limit) {
    return { allowed: false, message: `Daily ${type} limit reached.` };
  }

  const updateField = isVideo 
    ? 'video_generations_today = video_generations_today + 1, total_video_generations = total_video_generations + 1, last_video_date = CURRENT_DATE'
    : 'generations_today = generations_today + 1, total_generations = total_generations + 1, last_generation_date = CURRENT_DATE';
  
  await pool.query(`UPDATE users SET ${updateField} WHERE id = $1`, [userId]);
  
  return { allowed: true, remaining: limit - countToday - 1, limit };
}

// ============================================
// ROUTES
// ============================================

// --- AUTH ROUTES ---
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email.toLowerCase(), hash, name]
    );
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, token, user: newUser.rows[0] });
  } catch (e) { res.status(400).json({ error: 'Email already exists' }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  if (result.rows.length && await bcrypt.compare(password, result.rows[0].password_hash)) {
    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: result.rows[0].id, name: result.rows[0].name } });
  } else { res.status(400).json({ error: 'Invalid credentials' }); }
});

// --- AI GENERATION ---
app.post('/api/compare', authenticateToken, async (req, res) => {
  const usage = await checkAndIncrementUsage(req.user.id, 'descriptions');
  if (!usage.allowed) return res.status(429).json({ error: usage.message });

  const completion = await deepseekClient.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: req.body.question }],
  });

  res.json({ success: true, data: completion.choices[0].message.content, usage });
});

app.post('/api/video/generate', authenticateToken, async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'Product image URL is required' });

  const usage = await checkAndIncrementUsage(req.user.id, 'videos');
  if (!usage.allowed) return res.status(429).json({ error: usage.message });

  const output = await replicate.run(
    "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
    {
      input: {
        cond_aug: 0.02,
        decoding_t: 7,
        input_image: imageUrl,
        video_length: "14_frames_with_svd",
        sizing_strategy: "maintain_aspect_ratio",
        motion_bucket_id: 127,
        frames_per_second: 6
      }
    }
  );

  res.json({ success: true, videoUrl: output, usage });
});

// --- USAGE STATS ---
app.get('/api/usage', authenticateToken, async (req, res) => {
  const result = await pool.query('SELECT plan_type, generations_today, video_generations_today, total_generations, total_video_generations FROM users WHERE id = $1', [req.user.id]);
  const user = result.rows[0];
  res.json({
    success: true,
    usage: {
      plan: user.plan_type,
      descriptions: { today: user.generations_today, limit: PLAN_LIMITS[user.plan_type].descriptions },
      videos: { today: user.video_generations_today, limit: PLAN_LIMITS[user.plan_type].videos }
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on ${PORT}`));