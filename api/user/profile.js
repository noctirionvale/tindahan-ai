import jwt from 'jsonwebtoken';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT id, name, email, plan_type, created_at, avatar_url FROM users WHERE id = $1',
        [decoded.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      res.json({ success: true, user: result.rows[0] });
    }

    if (req.method === 'PUT') {
      const { name } = req.body;
      if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Name too short' });
      const result = await pool.query(
        'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, plan_type',
        [name.trim(), decoded.id]
      );
      res.json({ success: true, user: result.rows[0] });
    }
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}