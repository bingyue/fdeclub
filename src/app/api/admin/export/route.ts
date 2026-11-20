import { staffSession } from "@/lib/supabase";
import { csvCell } from "@/lib/validation";
import { rateLimit, HttpError, errorResponse } from "@/lib/http";
export async function GET(request: Request) {
  try {
    const session = await staffSession();
    if (!session) throw new HttpError(401, "请先登录已授权账号。");
    if (!["super_admin", "operations"].includes(session.profile.role))
      throw new HttpError(403, "仅总部运营角色可导出线索。");
    await rateLimit(request, "export", 5, session.user.id);
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "")
      .slice(0, 100)
      .replaceAll("%", "")
      .replaceAll("_", "");
    const status = url.searchParams.get("status");
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; offset < 10000; offset += 500) {
      let query = session.db
        .from("enterprise_leads")
        .select(
          "id,company,industry,company_size,city_name,contact_name,contact,pain_points,goals,budget,timeline,source_channel,utm_source,utm_medium,utm_campaign,status,assigned_to,next_followup_at,tags,created_at",
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + 499);
      if (q) query = query.ilike("company", `%${q}%`);
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw new HttpError(503, "导出失败，请重试。");
      rows.push(...data);
      if (data.length < 500) break;
    }
    const cols = [
      "id",
      "company",
      "industry",
      "company_size",
      "city_name",
      "contact_name",
      "contact",
      "pain_points",
      "goals",
      "budget",
      "timeline",
      "source_channel",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "status",
      "assigned_to",
      "next_followup_at",
      "tags",
      "created_at",
    ];
    const csv =
      "\ufeff" +
      [
        cols.map(csvCell).join(","),
        ...rows.map((row) =>
          cols
            .map((c) =>
              csvCell(
                Array.isArray(row[c])
                  ? (row[c] as unknown[]).join(" / ")
                  : row[c],
              ),
            )
            .join(","),
        ),
      ].join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fde-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "private, no-store",
        "X-Export-Limit": "10000",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
