import { runChat } from './_lib/scales.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ nhận POST.' });

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server chưa cấu hình GEMINI_API_KEY.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const history = Array.isArray(body.messages) ? body.messages : [];
    const today = body.today || new Date().toISOString().slice(0, 10);
    // Ảnh khách gửi: data URL (frontend đã resize ~1024px để tiết kiệm token).
    const image = typeof body.image === 'string' && body.image.startsWith('data:image/') ? body.image : null;
    const out = await runChat(key, history, today, image);
    return res.status(200).json(out);
  } catch (err) {
    return res.status(502).json({ error: String(err.message || err) });
  }
}
