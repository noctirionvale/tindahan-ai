import jwt from 'jsonwebtoken';
import axios from 'axios';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const token = req.headers.authorization?.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET);

    const { productName, features, language = 'en' } = req.body;
    const prompt = language === 'fil'
      ? `Gumawa ng 30-second Tagalog product voiceover script para sa: ${productName}. Features: ${features || 'walang ibinigay'}. Gawin itong engaging at para sa TikTok/Shopee. Output lang yung script.`
      : `Create a 30-second English product voiceover script for: ${productName}. Features: ${features || 'none'}. Make it engaging for TikTok/Shopee. Output only the script.`;

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a product marketing scriptwriter.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ success: true, script: response.data.choices[0].message.content.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}