import jwt from 'jsonwebtoken';
import pkg from 'pg';
import axios from 'axios';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const OWNER_EMAILS = ['spawntaneousbulb@gmail.com', 'noctirionvale@gmail.com'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      'SELECT email, plan_type, total_generations, generations_today, last_generation_date FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = result.rows[0];

    if (!OWNER_EMAILS.includes(user.email.toLowerCase())) {
      if (user.plan_type === 'free' && user.total_generations >= 15) {
        return res.status(429).json({ error: "You've used all 15 free descriptions! Upgrade to Starter for 100/month." });
      }
      const today = new Date().toISOString().split('T')[0];
      const lastDate = user.last_generation_date?.toISOString().split('T')[0];
      const countToday = lastDate === today ? (user.generations_today || 0) : 0;
      const limits = { free: 15, starter: 100, pro: 300, business: 800, premium: 999999 };
      const limit = limits[user.plan_type] || 15;
      if (countToday >= limit) {
        return res.status(429).json({ error: 'Daily limit reached.' });
      }
    }

    await pool.query(
      'UPDATE users SET generations_today = generations_today + 1, total_generations = total_generations + 1, last_generation_date = CURRENT_DATE WHERE id = $1',
      [decoded.id]
    );

    const { question } = req.body;
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: question }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ success: true, data: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Description error:', error);
    res.status(500).json({ error: error.message });
  }
}