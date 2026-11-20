import Link from "next/link";
import { redirect } from "next/navigation";
import { staffSession, configured } from "@/lib/supabase";
import { getEventTypes } from "@/lib/data";
import {
  sections,
  fieldLabels,
  type Section,
  type Row,
  editFields,
} from "@/lib/admin";
import { labels } from "@/lib/catalog";
import { PageHero, ButtonLink, EmptyState } from "@/components/ui";
import {
  AdminEditor,
  LeadNote,
  CityGrant,
  RegistrationActions,
} from "@/components/admin-editor";
import { Logout } from "@/components/auth-form";
import { metadata as meta } from "@/lib/seo";
export const metadata = {
  ...meta("运营工作台", "FDE Club授权业务运营后台。", "/admin"),
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
function display(value: unknown) {
  if (value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "是" : "否";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return labels[String(value)] || String(value);
}
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string;
    q?: string;
    status?: string;
    page?: string;
  }>;
}) {
  if (!configured())
    return (
      <>
        <PageHero
          eyebrow="OPERATIONS WORKSPACE"
          title="运营后台尚未连接"
          description="请按部署文档配置Supabase、运行迁移并创建首位管理员。后台不会展示模拟业务数据。"
        />
        <section className="section wrap">
          <EmptyState
            title="等待连接业务数据库"
            description="公开页面可以预览；申请只有在数据库实际接收后才会显示成功。"
            href="/"
            label="返回公开站"
          />
        </section>
      </>
    );
  const session = await staffSession();
  if (!session) redirect("/login");
  const { db, profile } = session;
  const params = await searchParams;
  const section: Section =
    params.section && Object.hasOwn(sections, params.section)
      ? (params.section as Section)
      : "dashboard";
  const allowed: Section[] =
    profile.role === "city_manager"
      ? ["dashboard", "enterprise", "partner", "event"]
      : (Object.keys(sections).filter(
          (s) => s !== "profile" || profile.role === "super_admin",
        ) as Section[]);
  if (!allowed.includes(section))
    return (
      <PageHero
        eyebrow="ACCESS RESTRICTED"
        title="没有此业务区的访问权限"
        description="请联系总部运营确认授权范围。"
      >
        <ButtonLink href="/admin">返回工作台</ButtonLink>
      </PageHero>
    );
  const q = (params.q || "")
    .slice(0, 100)
    .replaceAll("%", "")
    .replaceAll("_", "");
  const page = Math.max(1, Math.min(10000, Number(params.page) || 1));
  const status = (params.status || "").slice(0, 40);
  const [
    { data: cities, error: cityError },
    { data: users, error: userError },
    eventTypes,
  ] = await Promise.all([
    db.from("cities").select("id,name").order("name"),
    profile.role === "city_manager"
      ? Promise.resolve({ data: [], error: null })
      : db
          .from("profiles")
          .select("id,display_name,role,status")
          .order("created_at"),
    getEventTypes(),
  ]);
  if (cityError || userError) throw new Error("无法读取业务配置");
  const cityOptions = (cities || []).map((c) => ({ id: c.id, name: c.name }));
  const userOptions = (users || [])
    .filter(
      (u) =>
        u.status === "active" &&
        ["super_admin", "operations", "city_manager"].includes(u.role),
    )
    .map((u) => ({
      id: u.id,
      name: `${u.display_name || u.id.slice(0, 8)} · ${labels[u.role]}`,
    }));
  let rows: Row[] = [];
  let total = 0;
  let notes: Row[] = [];
  let registrations: Row[] = [];
  let grants: Row[] = [];
  const stats: { title: string; count: number }[] = [];
  if (section === "dashboard") {
    for (const [title, table, field, value] of [
      ["可访问企业线索", "enterprise_leads", "status", "new"],
      ["待审核城市申请", "city_applications", "status", "submitted"],
      ["待审核机构申请", "partner_applications", "status", "submitted"],
      ["待审核活动报名", "event_registrations", "status", "pending"],
    ]) {
      if (profile.role === "city_manager" && table === "city_applications")
        continue;
      const { count, error } = await db
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq(field, value);
      if (error) throw new Error("概览统计暂时不可用");
      stats.push({
        title: table === "enterprise_leads" ? "待初筛企业线索" : title,
        count: count || 0,
      });
    }
  } else {
    let query = db
      .from(sections[section].table)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const searchField = (
      {
        enterprise: "company",
        city: "organization",
        partner: "organization",
        event: "title",
        expert: "contact_name",
        membership: "contact_name",
        city_config: "name",
        profile: "display_name",
        setting: "key",
        audit: "table_name",
        notifications: "entity_type",
      } as Record<string, string>
    )[section];
    if (q && searchField) query = query.ilike(searchField, `%${q}%`);
    const { data, error, count } = await query.range(
      (page - 1) * 25,
      page * 25 - 1,
    );
    if (error) throw new Error("业务列表读取失败，请稍后重试");
    rows = (data || []) as Row[];
    total = count || 0;
    if (section === "enterprise" && rows.length) {
      const result = await db
        .from("lead_activities")
        .select("*")
        .in(
          "lead_id",
          rows.map((r) => r.id),
        )
        .order("created_at", { ascending: false });
      if (result.error) throw new Error("跟进记录读取失败");
      notes = result.data as Row[];
    }
    if (section === "event" && rows.length) {
      const result = await db
        .from("event_registrations")
        .select("*")
        .in(
          "event_id",
          rows.map((r) => r.id),
        )
        .order("created_at", { ascending: false });
      if (result.error) throw new Error("报名记录读取失败");
      registrations = result.data as Row[];
    }
    if (section === "city" && rows.length) {
      const result = await db
        .from("city_members")
        .select("*")
        .in(
          "application_id",
          rows.map((r) => r.id),
        );
      if (result.error) throw new Error("城市授权读取失败");
      grants = result.data as Row[];
    }
  }
  const url = (p: number) =>
    `/admin?${new URLSearchParams({ section, q, status, page: String(p) })}`;
  return (
    <section className="wrap admin-shell">
      <div className="admin-top">
        <div>
          <span className="eyebrow">FDE CLUB / OPERATIONS</span>
          <h1>{sections[section].title}</h1>
          <p>
            {profile.display_name || "运营账号"} · {labels[profile.role]} ·
            所有数据按当前授权范围显示
          </p>
        </div>
        <div className="admin-actions">
          <ButtonLink href="/" secondary>
            查看公开站
          </ButtonLink>
          <Logout />
        </div>
      </div>
      <nav className="admin-nav" aria-label="运营后台导航">
        {allowed.map((s) => (
          <Link
            key={s}
            href={`/admin?section=${s}`}
            aria-current={section === s ? "page" : undefined}
          >
            {sections[s].title}
          </Link>
        ))}
      </nav>
      {section === "dashboard" ? (
        <>
          <div className="stats-grid">
            {stats.map((s) => (
              <div className="stat-card" key={s.title}>
                <span>{s.title}</span>
                <strong>{s.count}</strong>
              </div>
            ))}
          </div>
          <div className="info-panel">
            <span className="eyebrow">WORKFLOW & RESPONSIBILITY</span>
            <h2>从清晰的跟进开始</h2>
            <p>
              企业线索：初筛 → 联系 → 明确需求 → PoC建议 → 项目转交 →
              合作或关闭。城市与机构申请单独审核。
            </p>
            <p>
              企业信息仅向授权人员开放。分配城市负责人前，先审核城市申请、设置账号角色并授予城市权限。
            </p>
            <p>
              通知服务：
              {process.env.NOTIFICATION_PROVIDER &&
              process.env.NOTIFICATION_PROVIDER !== "none"
                ? "已选择通知渠道，请结合通知队列核验发送结果。"
                : "尚未启用外部通知。申请已保存在数据库，通知保留在队列中。"}
            </p>
          </div>
        </>
      ) : (
        <>
          <form className="admin-search" method="GET">
            <input type="hidden" name="section" value={section} />
            <label className="sr-only" htmlFor="admin-search">
              搜索记录
            </label>
            <input
              id="admin-search"
              name="q"
              defaultValue={q}
              placeholder="搜索企业、机构、标题或姓名"
            />
            <label className="sr-only" htmlFor="admin-status">
              状态筛选
            </label>
            <select id="admin-status" name="status" defaultValue={status}>
              <option value="">全部状态</option>
              {[
                ...new Set([
                  ...rows.map((r) => String(r.status || "")),
                  ...Object.keys(labels).filter((k) =>
                    [
                      "new",
                      "triaged",
                      "contacted",
                      "qualified",
                      "poc_proposed",
                      "project_handoff",
                      "won",
                      "lost",
                      "submitted",
                      "review",
                      "interview",
                      "approved",
                      "rejected",
                      "active",
                      "paused",
                      "cooperating",
                      "closed",
                      "draft",
                      "published",
                      "cancelled",
                      "intent",
                      "expired",
                      "pending",
                      "sent",
                      "failed",
                      "processing",
                    ].includes(k),
                  ),
                ]),
              ].map((s) => (
                <option key={s} value={s}>
                  {labels[s] || s}
                </option>
              ))}
            </select>
            <button className="button">搜索 / 筛选</button>
            {section === "enterprise" && profile.role !== "city_manager" && (
              <a
                className="text-link"
                href={`/api/admin/export?${new URLSearchParams({ q, status })}`}
              >
                导出筛选结果 CSV（最多1万条）
              </a>
            )}
          </form>
          <p className="result-count">共 {total} 条记录 · 每页25条</p>
          {section === "event" && profile.role !== "city_manager" && (
            <details className="admin-record">
              <summary>
                <strong>＋ 创建新活动</strong>
                <span className="subtle">先保存草稿，确认信息后发布</span>
              </summary>
              <div className="record-body">
                <AdminEditor
                  kind="event"
                  row={{ id: "", status: "draft" }}
                  cities={cityOptions}
                  users={userOptions}
                  role={profile.role}
                  eventTypes={eventTypes}
                />
              </div>
            </details>
          )}
          {section === "city_config" && (
            <details className="admin-record">
              <summary>
                <strong>＋ 新建城市招募方向</strong>
                <span className="subtle">
                  默认招募中，正式合作状态须有已审核申请和有效授权
                </span>
              </summary>
              <div className="record-body">
                <AdminEditor
                  kind="city_config"
                  row={{ id: "", status: "recruiting", is_public: true }}
                  cities={cityOptions}
                  users={userOptions}
                  role={profile.role}
                  eventTypes={eventTypes}
                />
              </div>
            </details>
          )}
          {rows.map((row) => (
            <details className="admin-record" key={row.id}>
              <summary>
                <span className="record-title">
                  {String(
                    row.company ||
                      row.organization ||
                      row.title ||
                      row.name ||
                      row.display_name ||
                      row.contact_name ||
                      row.key ||
                      row.table_name ||
                      row.entity_type ||
                      row.id.slice(0, 8),
                  )}
                </span>
                <span className="record-meta">
                  <span>{String(row.city_name || "")}</span>
                  <span className="status">
                    {labels[row.status || ""] || row.status}
                  </span>
                  <span>
                    {new Date(String(row.created_at)).toLocaleString("zh-CN", {
                      timeZone: "Asia/Shanghai",
                      hour12: false,
                    })}
                  </span>
                </span>
              </summary>
              <div className="record-body">
                <dl className="record-data">
                  {Object.entries(row)
                    .filter(([k]) => !["dedupe_key"].includes(k))
                    .map(([key, value]) => (
                      <div key={key}>
                        <dt>{fieldLabels[key] || key}</dt>
                        <dd>{display(value)}</dd>
                      </div>
                    ))}
                </dl>
                {editFields[section] && (
                  <AdminEditor
                    kind={section}
                    row={row}
                    cities={cityOptions}
                    users={userOptions}
                    role={profile.role}
                    eventTypes={eventTypes}
                  />
                )}{" "}
                {section === "enterprise" && (
                  <>
                    <LeadNote id={row.id} />
                    <ul className="notes-list">
                      {notes
                        .filter((n) => n.lead_id === row.id)
                        .map((n) => (
                          <li key={n.id}>
                            <small>
                              {display(n.created_at)} ·{" "}
                              {String(n.created_by || "")}
                            </small>
                            {String(n.note)}
                          </li>
                        ))}
                    </ul>
                  </>
                )}
                {section === "city" && (
                  <>
                    <p className="subtle">
                      已关联授权：
                      {grants
                        .filter((g) => g.application_id === row.id)
                        .map((g) => `${g.user_id}（${labels[g.status || ""]}）`)
                        .join("、") || "暂无"}
                    </p>
                    {profile.role === "super_admin" &&
                      ["approved", "active"].includes(row.status || "") && (
                        <CityGrant
                          applicationId={row.id}
                          users={userOptions.filter(
                            (u) =>
                              (users || []).find((p) => p.id === u.id)?.role ===
                              "city_manager",
                          )}
                        />
                      )}
                  </>
                )}
                {section === "event" && (
                  <div className="admin-form">
                    <h3>报名名单与签到</h3>
                    <p className="subtle">
                      签到开放时间：活动开始前2小时至结束后24小时。待审核报名占用名额。
                    </p>
                    {registrations
                      .filter((r) => r.event_id === row.id)
                      .map((r) => (
                        <div key={r.id} className="registration-row">
                          <p>
                            {String(r.contact_name)} · {String(r.contact)} ·{" "}
                            {labels[r.status || ""]}
                          </p>
                          <RegistrationActions
                            id={r.id}
                            status={r.status || ""}
                          />
                        </div>
                      ))}
                    {!registrations.some((r) => r.event_id === row.id) && (
                      <p className="subtle">尚无报名。</p>
                    )}
                  </div>
                )}
              </div>
            </details>
          ))}
          {!rows.length && (
            <div className="admin-empty">暂无符合条件的业务记录。</div>
          )}
          <div className="pagination">
            {page > 1 ? <Link href={url(page - 1)}>← 上一页</Link> : <span />}
            <span>
              第 {page} 页 / {Math.max(1, Math.ceil(total / 25))} 页
            </span>
            {page * 25 < total ? (
              <Link href={url(page + 1)}>下一页 →</Link>
            ) : (
              <span />
            )}
          </div>
        </>
      )}
    </section>
  );
}
