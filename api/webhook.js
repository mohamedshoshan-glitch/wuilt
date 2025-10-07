import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

// متغيرات البيئة
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

app.post("/", async (req, res) => {
  try {
    const event = req.body;
    const order = event.order || {};
    const customer = order.customer || {};
    const phone = (customer.phone || "").replace("+", "");
    const status = order.status || "غير محدد";

    // ✅ نص الرسالة اللي هتروح لتليجرام
    let message = `📦 *تحديث طلب جديد من المتجر*\n`;
    message += `رقم الطلب: ${order.id || "غير متوفر"}\n`;
    message += `العميل: ${customer.name || "غير معروف"}\n`;
    message += `الهاتف: ${customer.phone || "غير متوفر"}\n`;
    message += `الحالة: ${status}\n\n`;

    switch (event.event) {
      case "order.created":
        message += "✅ تم إنشاء الطلب بنجاح.";
        break;
      case "order.updated":
        message += "🔄 تم تحديث الطلب.";
        break;
      case "order.cancelled":
        message += "❌ تم إلغاء الطلب.";
        break;
      case "order.completed":
        message += "🚚 تم تسليم الطلب.";
        break;
      default:
        message += "📢 حدث جديد في الطلب.";
    }

    // ✅ إعداد رابط واتساب جاهز
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      `مرحبًا ${customer.name || ""} 👋، تم استلام طلبك رقم ${order.id || ""} وهو الآن في حالة: ${status}.`
    )}`;

    // ✅ إرسال الرسالة إلى تليجرام مع زر واتساب
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📲 أرسل رسالة واتساب",
                url: whatsappUrl,
              },
            ],
          ],
        },
      }),
    });

    console.log("✅ تم إرسال الرسالة إلى تليجرام بنجاح");
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ خطأ أثناء إرسال الرسالة:", error);
    res.status(500).json({ error: error.toString() });
  }
});

export default app;
