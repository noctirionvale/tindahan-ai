import jwt from 'jsonwebtoken';
import pkg from 'pg';
import admin from 'firebase-admin';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { firebaseToken, name, email, avatar_url } = req.body;
    if (!firebaseToken) return res.status(400).json({ error: 'Firebase token required' });

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const userEmail = (decodedToken.email || email || `${decodedToken.uid}@x-social.tindahan.ai`).toLowerCase();
    const userName = name || decodedToken.name || userEmail.split('@')[0];
    const userAvatar = avatar_url || decodedToken.picture || null;

    let result = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);
    let user;

    if (result.rows.length > 0) {
      user = result.rows[0];
      if (!user.avatar_url && userAvatar) {
        await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [userAvatar, user.id]);
        user.avatar_url = userAvatar;
      }
    } else {
      const newUser = await pool.query(
        'INSERT INTO users (email, name, avatar_url, plan_type, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userEmail, userName, userAvatar, 'free', 'SOCIAL_LOGIN']
      );
      user = newUser.rows[0];
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true, token,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan_type || 'free', avatar_url: user.avatar_url || null }
    });
  } catch (error) {
    console.error('Social auth error:', error);
    res.status(500).json({ error: 'Social login failed' });
  }
}