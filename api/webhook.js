import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_TOKEN || !CHAT_ID) {
      return res.status(500).json({ error: "Missing Telegram credentials" });
    }

    // الرسالة اللي هنبعتها لتليجرام
    const message = `📩 New message from Wuilt:\n\n${JSON.stringify(req.body, null, 2)}`;

    // إرسالها إلى تليجرام
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
      }),
    });

    const data = await telegramResponse.json();

    if (!data.ok) {
      console.error("Telegram Error:", data);
      return res.status(500).json({ error: "Failed to send Telegram message" });
    }

    return res.status(200).json({ ok: true, data });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: error.message });
  }
}
