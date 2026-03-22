import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const token = req.headers.authorization?.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET);

    const { renderId } = req.query;
    if (!renderId) return res.status(400).json({ error: 'Missing renderId' });

    const response = await fetch(`https://api.creatomate.com/v2/renders/${renderId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CREATOMATE_API_KEY}`
      }
    });

    const data = await response.json();
    res.json({ 
      success: true,
      status: data.status,
      url: data.url || null,
      error: data.error || null
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}