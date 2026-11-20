import "server-only";
import { serviceDb } from "./supabase";
export async function dispatchNotifications() {
  const provider = process.env.NOTIFICATION_PROVIDER;
  if (!provider || provider === "none") return { sent: 0, pending: true };
  const db = serviceDb();
  const { data, error } = await db.rpc("claim_notifications", { p_limit: 10 });
  if (error) throw new Error("NOTIFICATION_QUEUE_UNAVAILABLE");
  let sent = 0;
  for (const item of data || []) {
    try {
      const content = `FDE Club 收到新的 ${item.entity_type} 记录。请登录管理后台跟进：${process.env.NEXT_PUBLIC_SITE_URL}/admin（编号 ${item.entity_id}）`;
      let response: Response;
      if (provider === "feishu") {
        const url = process.env.FEISHU_WEBHOOK_URL;
        if (!url?.startsWith("https://open.feishu.cn/open-apis/bot/"))
          throw new Error("INVALID_PROVIDER_CONFIG");
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            msg_type: "text",
            content: { text: content },
          }),
          signal: AbortSignal.timeout(8000),
        });
        const body = await response.json();
        if (!response.ok || (body.code ?? body.StatusCode ?? -1) !== 0)
          throw new Error("PROVIDER_REJECTED");
      } else if (provider === "resend") {
        if (
          !process.env.RESEND_API_KEY ||
          !process.env.NOTIFICATION_FROM ||
          !process.env.NOTIFICATION_TO
        )
          throw new Error("INVALID_PROVIDER_CONFIG");
        response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": item.id,
          },
          body: JSON.stringify({
            from: process.env.NOTIFICATION_FROM,
            to: [process.env.NOTIFICATION_TO],
            subject: "FDE Club · 新的合作申请",
            text: content,
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error("PROVIDER_REJECTED");
      } else throw new Error("UNKNOWN_PROVIDER");
      const { error: updateError } = await db
        .from("notification_outbox")
        .update({ status: "sent", last_error: null })
        .eq("id", item.id);
      if (updateError) throw new Error("QUEUE_UPDATE_FAILED");
      sent++;
    } catch {
      await db
        .from("notification_outbox")
        .update({
          status: "failed",
          last_error: "通知服务未确认接收；请检查服务端配置。",
          available_at: new Date(
            Date.now() + Math.min(3600, 60 * 2 ** item.attempts) * 1000,
          ).toISOString(),
        })
        .eq("id", item.id);
    }
  }
  return { sent };
}
