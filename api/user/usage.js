import jwt from 'jsonwebtoken';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const PLAN_LIMITS = {
  free:     { descriptions: 15, videos: 1, voices: 1 },
  starter:  { descriptions: 100, videos: 10, voices: 10 },
  pro:      { descriptions: 300, videos: 30, voices: 30 },
  business: { descriptions: 800, videos: 80, voices: 80 },
  premium:  { descriptions: 999999, videos: 100, voices: 999999 },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      'SELECT plan_type, generations_today, video_generations_today, voice_generations_today, total_generations, total_video_generations, total_voice_generations FROM users WHERE id = $1',
      [decoded.id]
    );
    const u = result.rows[0];
    const plan = u.plan_type || 'free';
    res.json({
      success: true,
      usage: {
        plan,
        descriptions: { used: u.generations_today || 0, limit: PLAN_LIMITS[plan]?.descriptions || 15, total: u.total_generations || 0 },
        videos: { used: u.video_generations_today || 0, limit: PLAN_LIMITS[plan]?.videos || 1, total: u.total_video_generations || 0 },
        voices: { used: u.voice_generations_today || 0, limit: PLAN_LIMITS[plan]?.voices || 1, total: u.total_voice_generations || 0 }
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}