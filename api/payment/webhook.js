import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const event = req.body;
    if (event?.data?.attributes?.type === 'link.payment.paid') {
      const remarks = event.data.attributes.data?.attributes?.remarks || '';
      const userIdMatch = remarks.match(/userId:(\d+)/);
      const planMatch = remarks.match(/plan:(\w+)/);

      if (userIdMatch && planMatch) {
        const userId = parseInt(userIdMatch[1]);
        const planKey = planMatch[1];
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        await pool.query(
          'UPDATE users SET plan_type = $1, plan_expires_at = $2 WHERE id = $3',
          [planKey, expiryDate, userId]
        );
        console.log(`✅ Upgraded user ${userId} to ${planKey}`);
      }
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ received: true });
  }
}