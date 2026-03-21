import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, name } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, name, plan_type) VALUES ($1, $2, $3, $4) RETURNING id, email, name, plan_type',
      [email.toLowerCase(), hash, name, 'free']
    );
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      success: true, token,
      user: { id: newUser.rows[0].id, name: newUser.rows[0].name, email: newUser.rows[0].email, plan: 'free' }
    });
  } catch (error) {
    res.status(400).json({ error: 'Email already exists' });
  }
}