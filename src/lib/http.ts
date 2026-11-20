import "server-only";
import { createHmac } from "node:crypto";
import { serviceDb } from "./supabase";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function ensureOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ).origin;
  if (origin !== expected)
    throw new HttpError(403, "请求来源不受信任，请从本站重新提交。");
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "请使用JSON提交");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "请求为空");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 24000) {
      await reader.cancel();
      throw new HttpError(413, "提交内容过长");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "提交格式不正确");
  }
}
export function hash(value: string) {
  const key = process.env.DATA_HASH_SECRET;
  if (!key || key.length < 32)
    throw new HttpError(503, "表单接收服务尚未配置，请稍后再试。");
  return createHmac("sha256", key).update(value).digest("hex");
}
export async function rateLimit(
  request: Request,
  scope: string,
  limit = 5,
  userId?: string,
) {
  let ip = "shared";
  if (process.env.CLIENT_IP_MODE === "vercel" && process.env.VERCEL)
    ip =
      request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
      "shared";
  else if (process.env.CLIENT_IP_MODE === "trusted-proxy")
    ip = request.headers.get("x-real-ip") || "shared";
  const key = hash(`${scope}:${userId || ip}`);
  const { data, error } = await serviceDb().rpc("consume_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_seconds: 600,
  });
  if (error) throw new HttpError(503, "接收服务暂时不可用，请稍后再试。");
  if (!data) throw new HttpError(429, "提交较频繁，请10分钟后再试。");
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  console.error("request_failed", {
    type: error instanceof Error ? error.name : "unknown",
  });
  return Response.json(
    { error: "接收服务暂时不可用，资料尚未确认提交，请稍后重试。" },
    { status: 503 },
  );
}
export function launchGuard() {
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.LAUNCH_APPROVED !== "true" ||
      !process.env.OPERATOR_NAME ||
      !process.env.PRIVACY_EMAIL)
  )
    throw new HttpError(503, "本站暂未开放资料收集，请等待正式开放通知。");
}
