// ============================================
// TINDAHAN.AI - Unified Backend Server
// ============================================

const textToSpeech = require('@google-cloud/text-to-speech');
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
  free: { descriptions: 15, videos: 1, voices: 1 },
  starter: { descriptions: 200, videos: 5, voices: 10 }, 
  pro: { descriptions: 500, videos: 20, voices: 30 },
  premium: { descriptions: 999999, videos: 100, voices: 999999 },
  business: { descriptions: 999999, videos: 100, voices: 999999 }
};

// Parse the JSON credentials from environment variable
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}');

// Initialize Google TTS client
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

// ============================================
// FIX: Add Owner Bypass to checkAndIncrementUsage
// ============================================

// Replace your existing checkAndIncrementUsage function with this:

async function checkAndIncrementUsage(userId, type) {
  const result = await pool.query(
    'SELECT plan_type, email, generations_today, video_generations_today, voice_generations_today, last_generation_date, last_video_date, last_voice_date, total_video_generations, total_voice_generations FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) throw new Error('User not found');
  const user = result.rows[0];

  // 👑 OWNER BYPASS - UNLIMITED FOR OWNERS!
  const OWNER_EMAILS = [
    'spawntaneousbulb@gmail.com',
    'noctirionvale@gmail.com'
  ];
  
  if (OWNER_EMAILS.includes(user.email.toLowerCase())) {
    console.log(`👑 Owner access: ${user.email} - Unlimited ${type}!`);
    return { 
      allowed: true, 
      remaining: 999999, 
      limit: 999999,
      plan: 'owner'
    };
  }

  // Rest of your existing code for regular users...
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

  // Reset if new day
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

  // Check free video lifetime limit
  if (user.plan_type === 'free' && isVideo && (user.total_video_generations >= 1)) {
    return { 
      allowed: false, 
      message: "You've used your 1 free video generation! Upgrade to Starter (₱599/month) for 5 videos/month." 
    };
  }

  // Check free voice lifetime limit
  if (user.plan_type === 'free' && isVoice && (user.total_voice_generations >= 1)) {
    return { 
      allowed: false, 
      message: "You've used your 1 free voice generation! Upgrade to Starter (₱599/month) for 10 voices/month." 
    };
  }

  // Check free description lifetime limit
  if (user.plan_type === 'free' && !isVideo && !isVoice && (user.total_generations >= 15)) {
    return { 
      allowed: false, 
      message: "You've used all 15 free descriptions! Upgrade to Starter (₱599/month) for 200 descriptions/month." 
    };
  }

  // Check daily limits for paid users
  if (countToday >= limit) {
    return { 
      allowed: false, 
      message: `Daily ${type} limit reached.` 
    };
  }

  // Increment usage
  let updateField;
  if (isVideo) {
    updateField = 'video_generations_today = video_generations_today + 1, total_video_generations = total_video_generations + 1, last_video_date = CURRENT_DATE';
  } else if (isVoice) {
    updateField = 'voice_generations_today = voice_generations_today + 1, total_voice_generations = total_voice_generations + 1, last_voice_date = CURRENT_DATE';
  } else {
    updateField = 'generations_today = generations_today + 1, total_generations = total_generations + 1, last_generation_date = CURRENT_DATE';
  }
  
  await pool.query(`UPDATE users SET ${updateField} WHERE id = $1`, [userId]);
  
  return { 
    allowed: true, 
    remaining: limit - countToday - 1, 
    limit 
  };
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

// --- VOICE GENERATION ROUTES ---

app.post('/api/voice/generate', authenticateToken, async (req, res) => {
  try {
    const { text, language = 'en-US', gender = 'FEMALE' } = req.body;

    if (!text || text.length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long. Maximum 5000 characters.' });
    }

    const usage = await checkAndIncrementUsage(req.user.id, 'voices');
    if (!usage.allowed) return res.status(429).json({ error: usage.message });

    console.log('🎙️ Generating voice');

    const voiceMap = {
      'FEMALE': { name: 'en-US-Neural2-F', languageCode: 'en-US' },
      'MALE': { name: 'en-US-Neural2-D', languageCode: 'en-US' },
      'FEMALE-CASUAL': { name: 'en-US-Neural2-C', languageCode: 'en-US' },
      'MALE-CASUAL': { name: 'en-US-Neural2-A', languageCode: 'en-US' },
      'FIL-FEMALE': { name: 'fil-PH-Wavenet-A', languageCode: 'fil-PH' },
      'FIL-MALE': { name: 'fil-PH-Wavenet-C', languageCode: 'fil-PH' }
    };

    const selectedVoice = voiceMap[gender] || voiceMap['FEMALE'];

    const ttsRequest = {
      input: { text: text },
      voice: {
        languageCode: selectedVoice.languageCode,
        name: selectedVoice.name,
        ssmlGender: gender.includes('MALE') ? 'MALE' : 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0
      }
    };

    const [response] = await ttsClient.synthesizeSpeech(ttsRequest);
    const audioBase64 = response.audioContent.toString('base64');
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

    console.log('✅ Voice generated successfully');

    res.json({
      success: true,
      audioUrl: audioUrl,
      audioBase64: audioBase64,
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

    console.log('📝 Script request:', { productName, features, language });

    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

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

    const script = completion.choices[0].message.content.trim();
    
    console.log('✅ Script generated');
    
    res.json({ success: true, script: script });

  } catch (error) {
    console.error('❌ Script error:', error);
    res.status(500).json({ error: 'Failed to generate script', details: error.message });
  }
});

app.get('/api/voice/usage', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT plan_type, voice_generations_today, last_voice_date, total_voice_generations FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

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
        limit: limit,
        remaining: user.plan_type === 'free' ? (1 - (user.total_voice_generations || 0)) : (limit - voicesToday),
        total: user.total_voice_generations || 0
      }
    });

  } catch (error) {
    console.error('Voice usage error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on ${PORT}`));