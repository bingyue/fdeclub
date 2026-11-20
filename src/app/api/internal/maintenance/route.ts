import { timingSafeEqual } from "node:crypto";
import { serviceDb } from "@/lib/supabase";
import { dispatchNotifications } from "@/lib/notifications";
import { HttpError, errorResponse } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    if (
      !secret ||
      secret.length < 32 ||
      !token ||
      Buffer.byteLength(token) !== Buffer.byteLength(secret) ||
      !timingSafeEqual(Buffer.from(token), Buffer.from(secret))
    )
      throw new HttpError(401, "未授权");
    const mode = new URL(request.url).searchParams.get("mode");
    if (mode === "retention") {
      const { data, error } = await serviceDb().rpc("purge_expired_data");
      if (error) throw new Error("RETENTION_FAILED");
      return Response.json({ deleted: data });
    }
    return Response.json(await dispatchNotifications());
  } catch (error) {
    return errorResponse(error);
  }
}
