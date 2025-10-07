// api/webhook.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // بعض times Wuilt يرسل النص مباشرة بدل JSON، نتأكد
  let payload = req.body;
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); } catch(e) {}
  }

  try {
    console.log("Webhook payload:", JSON.stringify(payload).slice(0, 2000));

    const eventType = payload.event || payload.type || "order.created";
    const order = payload.order || {};
    const customer = order.customer || payload.customer || {};
    const name = customer.name || "عميل";
    let phone = (customer.phone || "").toString();

    // تنظف رقم التليفون (تحويل +20... ل200...)
    phone = phone.replace(/\D/g, "");
    if (phone.startsWith("00")) phone = phone.slice(2);

    if (!phone) {
      // لو مفيش رقم نبلغ الادمن على تليجرام
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `⚠️ وصل حدث لكن مفيش رقم تليفون.\nOrder id: ${order.id || "-"}\nEvent: ${eventType}`
        })
      });
      return res.status(200).json({ ok: true, note: "no-phone" });
    }

    const orderId = order.id || "-";
    const status = order.status || "";

    // نص الرسالة اللي هنبعتها كاقتراح على واتساب
    let messageText = "";
    switch (eventType) {
      case "order.created":
        messageText = `✅ تم استلام طلبك رقم ${orderId} بنجاح. شكراً لثقتك بنا.`;
        break;
      case "order.updated":
        messageText = `🔄 تم تحديث حالة طلبك رقم ${orderId}. الحالة الآن: ${status}`;
        break;
      case "order.cancelled":
        messageText = `❌ تم إلغاء طلبك رقم ${orderId}. نرجو التواصل لمعرفة التفاصيل.`;
        break;
      case "order.completed":
        messageText = `🚚 تم توصيل طلبك رقم ${orderId}. شكراً لاختيارك.`;
        break;
      default:
        messageText = `📢 تحديث على طلبك رقم ${orderId}.`;
    }

    // رابط wa.me: لازم رقم بصيغة دولية بدون + أو مسافات
    const waMessage = `${messageText}\n\n(هذا إشعار تلقائي من متجرك)`;
    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`;

    // رسالة تليجرام للمسؤول مع زر يفتح واتساب
    const telegramText = `📦 *تحديث طلب*\n*رقم الطلب:* ${orderId}\n*العميل:* ${name}\n*الهاتف:* ${phone}\n\n${messageText}`;

  await fetch(
  `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
  {
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
              url: `https://wa.me/${phone.replace("+", "")}?text=${encodeURIComponent(
                `مرحبًا ${order.customer.name}، تم استلام طلبك رقم ${order.id} وهو الآن في حالة: ${order.status}`
              )}`,
            },
          ],
        ],
      },
    }),
  }
);


    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
}
