import jwt from 'jsonwebtoken';
import pkg from 'pg';
import textToSpeech from '@google-cloud/text-to-speech';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}');
const ttsClient = new textToSpeech.TextToSpeechClient({ credentials });

const OWNER_EMAILS = ['spawntaneousbulb@gmail.com', 'noctirionvale@gmail.com'];

const voiceMap = {
  'FEMALE': { name: 'en-US-Neural2-F', languageCode: 'en-US' },
  'MALE': { name: 'en-US-Neural2-D', languageCode: 'en-US' },
  'FEMALE-CASUAL': { name: 'en-US-Neural2-C', languageCode: 'en-US' },
  'MALE-CASUAL': { name: 'en-US-Neural2-A', languageCode: 'en-US' },
  'FEMALE-CALM': { name: 'en-US-Neural2-G', languageCode: 'en-US' },
  'FEMALE-CHEERFUL': { name: 'en-US-Neural2-H', languageCode: 'en-US' },
  'MALE-DEEP': { name: 'en-US-Neural2-I', languageCode: 'en-US' },
  'MALE-NARRATION': { name: 'en-US-Neural2-J', languageCode: 'en-US' },
  'FEMALE-STUDIO': { name: 'en-US-Studio-O', languageCode: 'en-US' },
  'MALE-STUDIO': { name: 'en-US-Studio-Q', languageCode: 'en-US' },
  'FIL-FEMALE': { name: 'fil-PH-Wavenet-A', languageCode: 'fil-PH' },
  'FIL-MALE': { name: 'fil-PH-Wavenet-C', languageCode: 'fil-PH' },
  'FIL-FEMALE-NEURAL': { name: 'fil-ph-Neural2-A', languageCode: 'fil-PH' },
  'FIL-MALE-NEURAL': { name: 'fil-ph-Neural2-D', languageCode: 'fil-PH' }
};

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
      'SELECT email, plan_type, total_voice_generations FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = result.rows[0];

    if (!OWNER_EMAILS.includes(user.email.toLowerCase())) {
      if (user.plan_type === 'free' && user.total_voice_generations >= 1) {
        return res.status(429).json({ error: "You've used your 1 free voice! Upgrade to Starter for 10/month." });
      }
    }

    await pool.query(
      'UPDATE users SET voice_generations_today = voice_generations_today + 1, total_voice_generations = total_voice_generations + 1, last_voice_date = CURRENT_DATE WHERE id = $1',
      [decoded.id]
    );

    const { text, gender = 'FEMALE' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const selectedVoice = voiceMap[gender] || voiceMap['FEMALE'];
    const [response] = await ttsClient.synthesizeSpeech({
      input: { text: text.substring(0, 5000) },
      voice: { languageCode: selectedVoice.languageCode, name: selectedVoice.name },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0.0 }
    });

    const audioBase64 = response.audioContent.toString('base64');
    res.json({ success: true, audioUrl: `data:audio/mp3;base64,${audioBase64}`, audioBase64 });
  } catch (error) {
    console.error('Voice error:', error);
    res.status(500).json({ error: error.message });
  }
}