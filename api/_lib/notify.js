// ─────────────────────────────────────────────────────────────
// Báo nhân viên/admin khi bot không đủ tự tin để tự trả lời.
//
// Nếu có env ADMIN_WEBHOOK_URL (Telegram bot, Slack, n8n, Zalo OA…)
// thì bắn thẳng vào đó. Không có thì ghi log server (xem trên Vercel).
// Không bao giờ ném lỗi ra ngoài — khách vẫn phải được trả lời tử tế
// kể cả khi webhook chết.
// ─────────────────────────────────────────────────────────────

export async function notifyAdmin({ reason, guestMessage, detail }) {
  const text = [
    'BOT CẦN NGƯỜI HỖ TRỢ',
    `Lý do: ${reason}`,
    guestMessage ? `Khách nhắn: ${guestMessage}` : null,
    detail ? `Chi tiết: ${detail}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const url = process.env.ADMIN_WEBHOOK_URL;
  if (!url) {
    console.log('[handoff]', text.replace(/\n/g, ' | '));
    return { sent: false };
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, content: text }), // hợp cả Slack & Discord
    });
    return { sent: true };
  } catch (err) {
    console.log('[handoff] webhook lỗi:', String(err));
    return { sent: false };
  }
}
