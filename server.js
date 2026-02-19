// ============================================
// TINDAHAN.AI - Backend Server with PostgreSQL Auth
// ============================================

const Replicate = require('replicate');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins temporarily for testing
  credentials: true
}));
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ PostgreSQL connected:', res.rows[0].now);
  }
});

// ============================================
// AUTH MIDDLEWARE
// ============================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// ============================================
// USAGE TRACKING & LIMITS
// ============================================

// Plan limits
const PLAN_LIMITS = {
  free: 5,
  starter: 50,
  pro: 200,
  business: 999999 // Unlimited
};

// Check and update usage
async function checkUsageLimit(userId) {
  const result = await pool.query(
    'SELECT plan_type, generations_today, last_generation_date FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];
  const today = new Date().toISOString().split('T')[0];
  const lastDate = user.last_generation_date ? user.last_generation_date.toISOString().split('T')[0] : null;

  // Reset count if it's a new day
  if (lastDate !== today) {
    await pool.query(
      'UPDATE users SET generations_today = 0, last_generation_date = CURRENT_DATE WHERE id = $1',
      [userId]
    );
    return { allowed: true, remaining: PLAN_LIMITS[user.plan_type] - 1, limit: PLAN_LIMITS[user.plan_type], plan: user.plan_type };
  }

  // Check if user has exceeded limit
  const limit = PLAN_LIMITS[user.plan_type] || PLAN_LIMITS.free;
  const remaining = limit - user.generations_today;

  if (user.generations_today >= limit) {
    return { allowed: false, remaining: 0, limit, plan: user.plan_type };
  }

  return { allowed: true, remaining: remaining - 1, limit, plan: user.plan_type };
}

// Increment usage count
async function incrementUsage(userId) {
  await pool.query(
    `UPDATE users 
     SET generations_today = generations_today + 1, 
         total_generations = total_generations + 1,
         last_generation_date = CURRENT_DATE 
     WHERE id = $1`,
    [userId]
  );
}

// ============================================
// AUTH ROUTES
// ============================================

// SIGNUP
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email.toLowerCase(), passwordHash, name]
    );

    const user = newUser.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET USER PROFILE
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at, last_login, plan_type FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// DEEPSEEK API ROUTE (WITH USAGE TRACKING)
// ============================================

app.post('/api/compare', authenticateToken, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    // Check usage limit
    const usageCheck = await checkUsageLimit(req.user.id);

    if (!usageCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Daily limit reached',
        limit: usageCheck.limit,
        plan: usageCheck.plan,
        message: `You've reached your daily limit of ${usageCheck.limit} generations. Upgrade your plan for more!`
      });
    }

    // Call Deepseek API
    const OpenAI = require('openai');
    
    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com'
    });

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseText = completion.choices[0].message.content;

    // Increment usage count
    await incrementUsage(req.user.id);

    res.json({
      success: true,
      data: responseText,
      usage: {
        remaining: usageCheck.remaining,
        limit: usageCheck.limit,
        plan: usageCheck.plan
      }
    });

  } catch (error) {
    console.error('Deepseek API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI response'
    });
  }
});

// ============================================
// GET USER USAGE STATS
// ============================================

app.get('/api/usage', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT plan_type, generations_today, last_generation_date, total_generations 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const limit = PLAN_LIMITS[user.plan_type] || PLAN_LIMITS.free;
    const today = new Date().toISOString().split('T')[0];
    const lastDate = user.last_generation_date ? user.last_generation_date.toISOString().split('T')[0] : null;

    // Reset if new day
    const generationsToday = (lastDate === today) ? user.generations_today : 0;

    res.json({
      success: true,
      usage: {
        plan: user.plan_type,
        today: generationsToday,
        limit: limit,
        remaining: limit - generationsToday,
        total: user.total_generations
      }
    });

  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: PostgreSQL`);
  console.log(`🔐 Auth: JWT`);
  console.log(`📊 Plan Limits: Free=${PLAN_LIMITS.free}, Starter=${PLAN_LIMITS.starter}, Pro=${PLAN_LIMITS.pro}`);
});

// ============================================
// ADD THESE SECTIONS TO YOUR WORKING server.js
// ============================================

// At the top with other dependencies:
const Replicate = require('replicate');

// After PayMongo configuration:
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

// Update PLAN_LIMITS to include video generations:
const PLAN_LIMITS = {
  free: { descriptions: 15, videos: 1 },        // 15 descriptions, 1 video
  starter: { descriptions: 200, videos: 10 },   // 200 descriptions, 10 videos
  premium: { descriptions: 999999, videos: 999999 } // Unlimited
};

// ============================================
// VIDEO GENERATION ROUTES
// ============================================

// Generate video from product image
app.post('/api/video/generate', authenticateToken, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Product image URL is required'
      });
    }

    // Check video generation limit
    const userResult = await pool.query(
      'SELECT plan_type, video_generations_today, last_video_date, total_video_generations FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const today = new Date().toISOString().split('T')[0];
    const lastDate = user.last_video_date ? user.last_video_date.toISOString().split('T')[0] : null;

    // Reset count if new day
    let videosToday = user.video_generations_today || 0;
    if (lastDate !== today) {
      videosToday = 0;
      await pool.query(
        'UPDATE users SET video_generations_today = 0, last_video_date = CURRENT_DATE WHERE id = $1',
        [req.user.id]
      );
    }

    // Check limit
    const limit = PLAN_LIMITS[user.plan_type]?.videos || PLAN_LIMITS.free.videos;
    
    if (user.plan_type === 'free' && (user.total_video_generations || 0) >= 1) {
      return res.status(429).json({
        success: false,
        error: 'Free video limit reached',
        message: 'You\'ve used your 1 free video generation! Upgrade to Starter (₱450/month) for 10 videos/month.'
      });
    }

    if (user.plan_type !== 'free' && videosToday >= limit) {
      return res.status(429).json({
        success: false,
        error: 'Daily video limit reached',
        message: `You've reached your daily limit of ${limit} videos.`
      });
    }

    console.log('🎬 Generating video for user:', req.user.id);

    // Generate video using Replicate's Stable Video Diffusion
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

    // Increment usage
    await pool.query(
      `UPDATE users 
       SET video_generations_today = video_generations_today + 1,
           total_video_generations = total_video_generations + 1,
           last_video_date = CURRENT_DATE
       WHERE id = $1`,
      [req.user.id]
    );

    console.log('✅ Video generated successfully');

    res.json({
      success: true,
      videoUrl: output,
      usage: {
        remaining: user.plan_type === 'free' ? 0 : limit - videosToday - 1,
        limit: limit,
        plan: user.plan_type
      }
    });

  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate video',
      details: error.message
    });
  }
});

// Get video generation stats
app.get('/api/video/usage', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT plan_type, video_generations_today, last_video_date, total_video_generations 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const today = new Date().toISOString().split('T')[0];
    const lastDate = user.last_video_date ? user.last_video_date.toISOString().split('T')[0] : null;
    
    const videosToday = (lastDate === today) ? (user.video_generations_today || 0) : 0;
    const limit = PLAN_LIMITS[user.plan_type]?.videos || PLAN_LIMITS.free.videos;

    res.json({
      success: true,
      usage: {
        plan: user.plan_type,
        today: videosToday,
        limit: limit,
        remaining: user.plan_type === 'free' ? (1 - (user.total_video_generations || 0)) : (limit - videosToday),
        total: user.total_video_generations || 0
      }
    });

  } catch (error) {
    console.error('Video usage stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// DATABASE MIGRATION FOR VIDEO TRACKING
// ============================================
// Run this SQL in Supabase:
/*
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS video_generations_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_video_date DATE,
ADD COLUMN IF NOT EXISTS total_video_generations INTEGER DEFAULT 0;
*/