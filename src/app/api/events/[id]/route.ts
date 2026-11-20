import { z } from "zod";
import { revalidatePath } from "next/cache";
import { userDb } from "@/lib/supabase";
import { contact } from "@/lib/validation";
import {
  ensureOrigin,
  readJson,
  rateLimit,
  launchGuard,
  HttpError,
  errorResponse,
} from "@/lib/http";
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("register"),
    contact_name: z.string().trim().min(1).max(80),
    contact,
    consent: z.literal(true),
  }),
  z.object({ action: z.literal("cancel") }),
]);
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    ensureOrigin(request);
    launchGuard();
    const { id } = await params;
    if (!z.uuid().safeParse(id).success)
      throw new HttpError(400, "活动标识无效");
    const db = await userDb();
    if (!db) throw new HttpError(503, "报名服务尚未配置。");
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) throw new HttpError(401, "请先登录，再报名或取消。");
    await rateLimit(request, "event", 15, user.id);
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(400, "请填写有效联系方式并同意条款。");
    const a = parsed.data;
    const { data, error } = await db.rpc("register_event", {
      p_event: id,
      p_name: a.action === "register" ? a.contact_name : "",
      p_contact: a.action === "register" ? a.contact : "",
      p_cancel: a.action === "cancel",
    });
    if (error)
      throw new HttpError(
        409,
        "操作未完成：活动可能已满、截止、取消，或不在允许的操作时段。",
      );
    revalidatePath("/events", "layout");
    return Response.json(
      { status: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
