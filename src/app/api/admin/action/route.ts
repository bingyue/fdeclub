import { revalidatePath } from "next/cache";
import { staffSession } from "@/lib/supabase";
import {
  ensureOrigin,
  readJson,
  rateLimit,
  HttpError,
  errorResponse,
} from "@/lib/http";
import { adminAction, patchSchemas } from "@/lib/validation";
export async function POST(request: Request) {
  try {
    ensureOrigin(request);
    const session = await staffSession();
    if (!session) throw new HttpError(401, "请使用已授权的运营账号登录。");
    await rateLimit(request, "admin", 90, session.user.id);
    const parsed = adminAction.safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(400, "操作内容不完整或格式不正确。");
    const a = parsed.data;
    let result;
    if (a.action === "update") {
      const patch = patchSchemas[a.kind].safeParse(a.patch);
      if (!patch.success || !Object.keys(patch.data).length)
        throw new HttpError(
          400,
          "请检查字段格式，时间须完整，配置内容须符合约定结构。",
        );
      result = await session.db.rpc("manage_record", {
        p_kind: a.kind,
        p_id: a.id,
        p_patch: patch.data,
      });
    } else if (a.action === "note")
      result = await session.db.rpc("add_lead_note", {
        p_id: a.id,
        p_note: a.note,
      });
    else if (a.action === "grant")
      result = await session.db.rpc("grant_city_member", {
        p_application: a.application_id,
        p_user: a.user_id,
        p_status: a.status,
      });
    else
      result = await session.db.rpc("review_registration", {
        p_id: a.id,
        p_status: a.status,
      });
    if (result.error)
      throw new HttpError(
        result.error.code === "42501" ? 403 : 400,
        "操作未保存：请检查授权范围、状态流转、负责人、活动信息或剩余名额。",
      );
    revalidatePath("/", "layout");
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
