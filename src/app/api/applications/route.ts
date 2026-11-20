import { after } from "next/server";
import { schemas, type ApplicationKind } from "@/lib/validation";
import {
  ensureOrigin,
  readJson,
  rateLimit,
  hash,
  launchGuard,
  HttpError,
  errorResponse,
} from "@/lib/http";
import { serviceDb } from "@/lib/supabase";
import { dispatchNotifications } from "@/lib/notifications";
export async function POST(request: Request) {
  try {
    ensureOrigin(request);
    const body = await readJson(request);
    if (
      !body ||
      typeof body.kind !== "string" ||
      !Object.hasOwn(schemas, body.kind)
    )
      throw new HttpError(400, "请选择有效的申请类型。");
    const kind = body.kind as ApplicationKind;
    const result = schemas[kind].safeParse(body.data);
    if (!result.success) {
      const issues = Object.fromEntries(
        result.error.issues.map((i) => [String(i.path[0]), i.message]),
      );
      return Response.json(
        { error: "请检查表单中标记的内容。", issues },
        { status: 400 },
      );
    }
    launchGuard();
    await rateLimit(request, "applications");
    const { consent, website, ...payload } = result.data;
    void consent;
    void website;
    const dedupe = hash(
      kind +
        ":" +
        JSON.stringify(payload) +
        ":" +
        new Date().toISOString().slice(0, 10),
    );
    const { data, error } = await serviceDb().rpc("submit_application", {
      p_kind: kind,
      p_data: payload,
      p_dedupe: dedupe,
    });
    if (error || !data) throw new HttpError(503, "资料未能保存，请稍后重试。");
    after(async () => {
      try {
        await dispatchNotifications();
      } catch {
        console.error("notification_dispatch_unavailable");
      }
    });
    return Response.json(
      { id: data, message: "资料已接收" },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
