// Vercel serverless function: POST /api/contact sends a contact form request to Telegram.
// Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in the Vercel project environment.

const LIMITS = { name: 100, contact: 200, task: 3000 };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(500).json({ ok: false, error: 'config' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'body' });

  // Honeypot: real visitors never see or fill this field.
  if (body.website) return res.status(200).json({ ok: true });

  const field = k => String(body[k] ?? '').trim().slice(0, LIMITS[k]);
  const name = field('name');
  const contact = field('contact');
  const task = field('task');
  const lang = body.lang === 'en' ? 'EN' : 'RU';
  if (!name || !contact) return res.status(400).json({ ok: false, error: 'fields' });

  const text = [
    `Новая заявка с сайта (${lang})`,
    '',
    `Имя: ${name}`,
    `Контакт: ${contact}`,
    task ? `\nЗадача:\n${task}` : 'Задача: не указана',
  ].join('\n');

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!tg.ok) return res.status(502).json({ ok: false, error: 'telegram' });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false, error: 'telegram' });
  }
};
