// Vercel serverless function: POST /api/contact sends a contact form request to Telegram.
// Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in the Vercel project environment.
//
// Abuse protection, in order: JSON only (so browsers on other sites must pass a CORS preflight,
// which this endpoint never grants), own-origin check, body size cap, per-IP rate limit,
// honeypot field, minimum time to fill the form, link-spam filter. Messages go to Telegram as
// plain text (no parse_mode), so nothing a visitor types is ever interpreted as markup.

const LIMITS = { name: 100, contact: 200, task: 3000 };
const MAX_BODY = 10 * 1024; // bytes
const MIN_FILL_MS = 2500;
const ALLOWED_ORIGIN = /^https:\/\/(web-is-everything|portfolio-2026(-[a-z0-9-]+)?)\.vercel\.app$|^http:\/\/localhost(:\d+)?$/;

// Best-effort limits kept in memory per warm instance.
const RATE = { perIp: 3, ipWindowMs: 10 * 60 * 1000, global: 30, globalWindowMs: 60 * 60 * 1000 };
const hits = new Map();
let globalHits = [];

function rateLimited(ip, now) {
  globalHits = globalHits.filter(t => now - t < RATE.globalWindowMs);
  const mine = (hits.get(ip) || []).filter(t => now - t < RATE.ipWindowMs);
  if (mine.length >= RATE.perIp || globalHits.length >= RATE.global) {
    hits.set(ip, mine);
    return true;
  }
  mine.push(now);
  hits.set(ip, mine);
  globalHits.push(now);
  if (hits.size > 5000) hits.clear();
  return false;
}

// Drops control and invisible formatting characters (keeps newlines and tabs), trims, caps length.
function clean(value, max) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F​-‏‪-‮⁠-⁩﻿]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

const reply = (res, status, body) => res.status(status).json(body);
// Bots get a normal-looking success so they don't retry or adapt.
const silentOk = res => reply(res, 200, { ok: true });

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { ok: false, error: 'method' });
  }

  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    return reply(res, 415, { ok: false, error: 'type' });
  }
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_ORIGIN.test(origin)) return reply(res, 403, { ok: false, error: 'origin' });
  const site = req.headers['sec-fetch-site'];
  if (site && site !== 'same-origin') return reply(res, 403, { ok: false, error: 'origin' });
  if (Number(req.headers['content-length'] || 0) > MAX_BODY) return reply(res, 413, { ok: false, error: 'size' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return reply(res, 500, { ok: false, error: 'config' });

  // Vercel sets x-real-ip / x-forwarded-for itself and overwrites client-supplied values.
  const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const now = Date.now();
  if (rateLimited(ip, now)) return reply(res, 429, { ok: false, error: 'rate' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(res, 400, { ok: false, error: 'body' });

  // Honeypot: real visitors never see or fill this field.
  if (body.website) return silentOk(res);
  // Humans need a few seconds to fill in the form; `elapsed` is ms since the form opened.
  const elapsed = Number(body.elapsed);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return silentOk(res);

  const name = clean(body.name, LIMITS.name);
  const contact = clean(body.contact, LIMITS.contact);
  const task = clean(body.task, LIMITS.task);
  const lang = body.lang === 'en' ? 'EN' : 'RU';
  if (!name || !contact) return reply(res, 400, { ok: false, error: 'fields' });
  // Link spam: real requests rarely carry more than a couple of links.
  if ((`${name} ${contact} ${task}`.match(/https?:\/\/|www\./gi) || []).length > 2) return silentOk(res);

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
    if (!tg.ok) return reply(res, 502, { ok: false, error: 'telegram' });
    return reply(res, 200, { ok: true });
  } catch {
    return reply(res, 502, { ok: false, error: 'telegram' });
  }
};
