import { z } from "zod";
import { userDb } from "@/lib/supabase";
import {
  ensureOrigin,
  readJson,
  rateLimit,
  launchGuard,
  HttpError,
  errorResponse,
} from "@/lib/http";
const schema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("password"),
    email: z.email(),
    password: z.string().min(8).max(200),
  }),
  z.object({
    mode: z.literal("email"),
    email: z.email(),
    consent: z.literal(true),
  }),
  z.object({ mode: z.literal("logout") }),
]);
export async function POST(request: Request) {
  try {
    ensureOrigin(request);
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(400, "请检查邮箱、密码和条款同意。");
    const db = await userDb();
    if (!db) throw new HttpError(503, "账号服务尚未配置。");
    const a = parsed.data;
    if (a.mode === "logout") {
      const { error } = await db.auth.signOut();
      if (error) throw new HttpError(503, "退出失败，请重试。");
      return Response.json({ ok: true });
    }
    await rateLimit(request, "login", 8);
    if (a.mode === "email") {
      if (process.env.EMAIL_AUTH_ENABLED === "false")
        throw new HttpError(
          503,
          "邮箱自助登录暂未开放，请使用已分配的账号密码。",
        );
      launchGuard();
      const { error } = await db.auth.signInWithOtp({
        email: a.email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
        },
      });
      if (error) throw new HttpError(400, "登录邮件暂时无法发送，请稍后再试。");
      return Response.json({
        message: "若邮箱可用，你将收到登录链接。请检查收件箱及垃圾邮件。",
      });
    }
    const { error } = await db.auth.signInWithPassword({
      email: a.email,
      password: a.password,
    });
    if (error)
      throw new HttpError(401, "邮箱或密码不正确，或账号尚未完成验证。");
    const {
      data: { user },
    } = await db.auth.getUser();
    const { data: profile } = await db
      .from("profiles")
      .select("role,status")
      .eq("id", user!.id)
      .single();
    return Response.json({
      redirect:
        profile?.status === "active" &&
        ["super_admin", "operations", "city_manager"].includes(profile.role)
          ? "/admin"
          : "/events",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
