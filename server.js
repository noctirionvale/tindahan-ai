// ============================================
// TINDAHAN.AI - Unified Backend Server (UPDATED)
// ============================================


const textToSpeech = require('@google-cloud/text-to-speech');
const Replicate = require('replicate');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const OpenAI = require('openai');
const multer = require('multer');
const fetch = require('node-fetch');    // must be node-fetch@2 (v3 is ESM-only)
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// ✅ FIX: CSP header that allows blob: and https: images
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' blob: data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https:;"
  );
  next();
});

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Services Initialization
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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
  free: { descriptions: 15, videos: 1, voices: 1 },
  starter: { descriptions: 200, videos: 5, voices: 10 }, 
  pro: { descriptions: 500, videos: 20, voices: 30 },
  premium: { descriptions: 999999, videos: 100, voices: 999999 },
  business: { descriptions: 999999, videos: 100, voices: 999999 }
};

const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}');

const ttsClient = new textToSpeech.TextToSpeechClient({
  credentials: credentials
});

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
    'SELECT plan_type, email, generations_today, video_generations_today, voice_generations_today, last_generation_date, last_video_date, last_voice_date, total_video_generations, total_voice_generations FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) throw new Error('User not found');
  const user = result.rows[0];

  const OWNER_EMAILS = [
    'spawntaneousbulb@gmail.com',
    'noctirionvale@gmail.com'
  ];
  
  if (OWNER_EMAILS.includes(user.email.toLowerCase())) {
    console.log(`👑 Owner access: ${user.email} - Unlimited ${type}!`);
    return { allowed: true, remaining: 999999, limit: 999999, plan: 'owner' };
  }

  const today = new Date().toISOString().split('T')[0];
  const isVideo = type === 'videos';
  const isVoice = type === 'voices';
  
  let lastDate, countToday;
  
  if (isVideo) {
    lastDate = user.last_video_date?.toISOString().split('T')[0];
    countToday = user.video_generations_today || 0;
  } else if (isVoice) {
    lastDate = user.last_voice_date?.toISOString().split('T')[0];
    countToday = user.voice_generations_today || 0;
  } else {
    lastDate = user.last_generation_date?.toISOString().split('T')[0];
    countToday = user.generations_today || 0;
  }

  if (lastDate !== today) {
    countToday = 0;
    let resetField;
    if (isVideo) {
      resetField = 'video_generations_today = 0, last_video_date = CURRENT_DATE';
    } else if (isVoice) {
      resetField = 'voice_generations_today = 0, last_voice_date = CURRENT_DATE';
    } else {
      resetField = 'generations_today = 0, last_generation_date = CURRENT_DATE';
    }
    await pool.query(`UPDATE users SET ${resetField} WHERE id = $1`, [userId]);
  }

  const limit = PLAN_LIMITS[user.plan_type]?.[type] || PLAN_LIMITS.free[type];

  if (user.plan_type === 'free' && isVideo && (user.total_video_generations >= 1)) {
    return { allowed: false, message: "You've used your 1 free video generation! Upgrade to Starter (₱599/month) for 5 videos/month." };
  }

  if (user.plan_type === 'free' && isVoice && (user.total_voice_generations >= 1)) {
    return { allowed: false, message: "You've used your 1 free voice generation! Upgrade to Starter (₱599/month) for 10 voices/month." };
  }

  if (user.plan_type === 'free' && !isVideo && !isVoice && (user.total_generations >= 15)) {
    return { allowed: false, message: "You've used all 15 free descriptions! Upgrade to Starter (₱599/month) for 200 descriptions/month." };
  }

  if (countToday >= limit) {
    return { allowed: false, message: `Daily ${type} limit reached.` };
  }

  let updateField;
  if (isVideo) {
    updateField = 'video_generations_today = video_generations_today + 1, total_video_generations = total_video_generations + 1, last_video_date = CURRENT_DATE';
  } else if (isVoice) {
    updateField = 'voice_generations_today = voice_generations_today + 1, total_voice_generations = total_voice_generations + 1, last_voice_date = CURRENT_DATE';
  } else {
    updateField = 'generations_today = generations_today + 1, total_generations = total_generations + 1, last_generation_date = CURRENT_DATE';
  }
  
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
      'INSERT INTO users (email, password_hash, name, plan_type) VALUES ($1, $2, $3, $4) RETURNING id, email, name, plan_type',
      [email.toLowerCase(), hash, name, 'free']
    );
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ 
      success: true, 
      token, 
      user: { 
        id: newUser.rows[0].id, 
        name: newUser.rows[0].name,
        email: newUser.rows[0].email,
        plan: newUser.rows[0].plan_type || 'free'
      } 
    });
  } catch (e) { 
    res.status(400).json({ error: 'Email already exists' }); 
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  
  if (result.rows.length && await bcrypt.compare(password, result.rows[0].password_hash)) {
    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: result.rows[0].id, 
        name: result.rows[0].name,
        email: result.rows[0].email,
        plan: result.rows[0].plan_type || 'free'
      } 
    });
  } else { 
    res.status(400).json({ error: 'Invalid credentials' }); 
  }
});

// ============================================
// PROFILE MANAGEMENT ROUTES
// ============================================

app.get('/api/user/usage', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT plan_type, generations_today, video_generations_today, voice_generations_today, total_generations, total_video_generations, total_voice_generations FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = result.rows[0];
    const plan = user.plan_type || 'free';

    res.json({
      success: true,
      usage: {
        plan: plan,
        descriptions: { used: user.generations_today || 0, limit: PLAN_LIMITS[plan]?.descriptions || 15, total: user.total_generations || 0 },
        videos: { used: user.video_generations_today || 0, limit: PLAN_LIMITS[plan]?.videos || 1, total: user.total_video_generations || 0 },
        voices: { used: user.voice_generations_today || 0, limit: PLAN_LIMITS[plan]?.voices || 1, total: user.total_voice_generations || 0 }
      }
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    const result = await pool.query(
      'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, plan_type',
      [name.trim(), userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json({ success: true, message: 'Name updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

app.put('/api/user/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'All fields are required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long' });

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) return res.status(401).json({ message: 'Current password is incorrect' });

    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) return res.status(400).json({ message: 'New password must be different from current password' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, plan_type, created_at, avatar_url FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// ============================================
// AVATAR UPLOAD ROUTE - Stores as base64 data URL (no third-party needed)
// ============================================
app.post('/api/user/avatar/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log(`📸 Processing avatar: ${req.file.mimetype}, ${req.file.size} bytes`);

    // Convert to base64 data URL and store directly in DB
    const base64Image = req.file.buffer.toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const result = await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, avatar_url, plan_type',
      [imageUrl, req.user.id]
    );

    console.log('✅ Avatar saved successfully');
    res.json({ success: true, message: 'Avatar updated successfully', user: result.rows[0] });

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

// ============================================
// AI GENERATION ROUTES
// ============================================

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

// ============================================
// VOICE GENERATION ROUTES
// ============================================

app.post('/api/voice/generate', authenticateToken, async (req, res) => {
  try {
    const { text, language = 'en-US', gender = 'FEMALE' } = req.body;

    if (!text || text.length === 0) return res.status(400).json({ error: 'Text is required' });
    if (text.length > 5000) return res.status(400).json({ error: 'Text too long. Maximum 5000 characters.' });

    const usage = await checkAndIncrementUsage(req.user.id, 'voices');
    if (!usage.allowed) return res.status(429).json({ error: usage.message });

    const voiceMap = {
  // Basic voices
  'FEMALE': { name: 'en-US-Neural2-F', languageCode: 'en-US' },
  'MALE': { name: 'en-US-Neural2-D', languageCode: 'en-US' },
  'FEMALE-CASUAL': { name: 'en-US-Neural2-C', languageCode: 'en-US' },
  'MALE-CASUAL': { name: 'en-US-Neural2-A', languageCode: 'en-US' },
  
  // Additional English voices
  'FEMALE-CALM': { name: 'en-US-Neural2-G', languageCode: 'en-US' },
  'FEMALE-CHEERFUL': { name: 'en-US-Neural2-H', languageCode: 'en-US' },
  'MALE-DEEP': { name: 'en-US-Neural2-I', languageCode: 'en-US' },
  'MALE-NARRATION': { name: 'en-US-Neural2-J', languageCode: 'en-US' },
  
  // Premium Studio voices (higher quality)
  'FEMALE-STUDIO': { name: 'en-US-Studio-O', languageCode: 'en-US' },
  'MALE-STUDIO': { name: 'en-US-Studio-Q', languageCode: 'en-US' },
  
  // Newscast voices
  'FEMALE-NEWSCAST': { name: 'en-US-News-N', languageCode: 'en-US' },
  'MALE-NEWSCAST': { name: 'en-US-News-M', languageCode: 'en-US' },
  
  // Filipino voices
  'FIL-FEMALE': { name: 'fil-PH-Wavenet-A', languageCode: 'fil-PH' },
  'FIL-MALE': { name: 'fil-PH-Wavenet-C', languageCode: 'fil-PH' }
};

    const selectedVoice = voiceMap[gender] || voiceMap['FEMALE'];

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: { languageCode: selectedVoice.languageCode, name: selectedVoice.name, ssmlGender: gender.includes('MALE') ? 'MALE' : 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0.0 }
    });

    const audioBase64 = response.audioContent.toString('base64');

    res.json({
      success: true,
      audioUrl: `data:audio/mp3;base64,${audioBase64}`,
      audioBase64,
      usage
    });
  } catch (error) {
    console.error('Voice generation error:', error);
    res.status(500).json({ error: 'Failed to generate voice', details: error.message });
  }
});

app.post('/api/voice/generate-script', authenticateToken, async (req, res) => {
  try {
    const { productName, features, language = 'en' } = req.body;
    if (!productName) return res.status(400).json({ error: 'Product name is required' });

    const prompt = language === 'fil' 
      ? `Gumawa ng 30-second Tagalog product voiceover script para sa: ${productName}. Features: ${features || 'walang ibinigay'}. Gawin itong engaging at para sa TikTok/Shopee. Output lang yung script, walang intro.`
      : `Create a 30-second English product voiceover script for: ${productName}. Features: ${features || 'none provided'}. Make it engaging for TikTok/Shopee. Output only the script, no intro.`;

    const completion = await deepseekClient.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a product marketing scriptwriter.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    res.json({ success: true, script: completion.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Script error:', error);
    res.status(500).json({ error: 'Failed to generate script', details: error.message });
  }
});

app.get('/api/voice/usage', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT plan_type, voice_generations_today, last_voice_date, total_voice_generations FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = result.rows[0];
    const today = new Date().toISOString().split('T')[0];
    const lastDate = user.last_voice_date ? user.last_voice_date.toISOString().split('T')[0] : null;
    const voicesToday = (lastDate === today) ? (user.voice_generations_today || 0) : 0;
    const limit = PLAN_LIMITS[user.plan_type]?.voices || 10;

    res.json({
      success: true,
      usage: {
        plan: user.plan_type,
        today: voicesToday,
        limit,
        remaining: user.plan_type === 'free' ? (1 - (user.total_voice_generations || 0)) : (limit - voicesToday),
        total: user.total_voice_generations || 0
      }
    });
  } catch (error) {
    console.error('Voice usage error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// SERVER LISTEN - ALWAYS AT THE END
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on ${PORT}`));