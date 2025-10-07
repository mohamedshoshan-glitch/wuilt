// api/webhook.js

export default async function handler(req, res) {
  try {
    // ✅ استدعاء متغيرات البيئة من Vercel
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // ✅ تأكيد أن الريكوست من نوع POST ومعه body
    const body = req.body ? req.body : {};
    const messageText = body.message || "📦 Test: New order received from Wuilt!";

    // ✅ إرسال رسالة إلى Telegram
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: messageText,
      }),
    });

    const telegramData = await telegramResponse.json();

    // ✅ الرد بنجاح
    return res.status(200).json({ success: true, telegramData });
  } catch (err) {
    console.error("❌ Server Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
