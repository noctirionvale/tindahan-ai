import jwt from 'jsonwebtoken';
import pkg from 'pg';
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

    // Check usage
    const result = await pool.query(
      'SELECT email, plan_type, total_video_generations FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = result.rows[0];

    if (!OWNER_EMAILS.includes(user.email.toLowerCase())) {
      if (user.plan_type === 'free' && user.total_video_generations >= 1) {
        return res.status(429).json({ 
          error: "You've used your 1 free video! Upgrade to generate more." 
        });
      }
    }

    const { imageUrl, caption, callToAction } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Image URL is required' });

    // Call Creatomate
    const response = await fetch('https://api.creatomate.com/v2/renders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CREATOMATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: 'ce0ca4cc-c823-4afa-b446-b3852d657cd4',
        modifications: {
          'Product Image.source': imageUrl,
          'Caption.text': caption || 'Check out this product!',
          'Call To Action.text': callToAction || 'Order now!'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Creatomate error:', data);
      return res.status(500).json({ error: 'Video generation failed' });
    }

    // Increment usage
    await pool.query(
      'UPDATE users SET video_generations_today = video_generations_today + 1, total_video_generations = total_video_generations + 1, last_video_date = CURRENT_DATE WHERE id = $1',
      [decoded.id]
    );

    // Creatomate returns array of renders
    const render = Array.isArray(data) ? data[0] : data;

    res.json({ 
      success: true, 
      renderId: render.id,
      status: render.status,
      url: render.url || null
    });

  } catch (error) {
    console.error('Video error:', error);
    res.status(500).json({ error: error.message });
  }
}