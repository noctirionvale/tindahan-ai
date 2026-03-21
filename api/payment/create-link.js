import jwt from 'jsonwebtoken';

const PLAN_PRICES = {
  starter: 29900,
  pro: 59900,
  business: 99900,
};

const PLAN_NAMES = {
  starter: 'Tindahan.AI Starter Plan',
  pro: 'Tindahan.AI Pro Plan',
  business: 'Tindahan.AI Business Plan',
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
    const { planKey } = req.body;

    if (!PLAN_PRICES[planKey]) return res.status(400).json({ error: 'Invalid plan' });

    const response = await fetch('https://api.paymongo.com/v1/links', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: PLAN_PRICES[planKey],
            currency: 'PHP',
            description: PLAN_NAMES[planKey],
            remarks: `userId:${decoded.id}|plan:${planKey}`
          }
        }
      })
    });

    const data = await response.json();
    res.json({ success: true, checkoutUrl: data.data.attributes.checkout_url });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
}