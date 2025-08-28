export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }
  try {
    const { message, name, phone } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ ok: false, error: 'Missing message' });
      return;
    }
    const chatText = `Ocean Infra Chat\nMessage: ${message}\nName: ${name || '-'}\nPhone: ${phone || '-'}`;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      res.status(500).json({ ok: false, error: 'Server not configured' });
      return;
    }
    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const r = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: chatText })
    });
    const data = await r.json();
    if (!data.ok) {
      res.status(502).json({ ok: false, error: 'Telegram failed' });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Unexpected error' });
  }
}

