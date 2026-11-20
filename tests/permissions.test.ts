import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
let db: PGlite;
const ids = {
  admin: randomUUID(),
  ops: randomUUID(),
  city: randomUUID(),
  member: randomUUID(),
  other: randomUUID(),
  disabled: randomUUID(),
};
let shanghai: string,
  beijing: string,
  lead: string,
  foreignLead: string,
  unassignedLead: string;
async function actor<T = Record<string, unknown>>(
  user: string,
  sql: string,
  args: unknown[] = [],
) {
  await db.exec("begin; set local role authenticated;");
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [user]);
  try {
    const result = await db.query<T>(sql, args);
    await db.exec("commit");
    return result.rows;
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
async function service<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = [],
) {
  await db.exec("begin; set local role service_role;");
  try {
    const result = await db.query<T>(sql, args);
    await db.exec("commit");
    return result.rows;
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
async function rpc(
  user: string,
  kind: string,
  id: string | null,
  patch: unknown,
) {
  return actor(user, "select public.manage_record($1,$2,$3)", [
    kind,
    id,
    JSON.stringify(patch),
  ]);
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;`,
  );
  for (const migration of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync(`supabase/migrations/${migration}`, "utf8"));
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  for (const [role, id] of Object.entries(ids)) {
    await db.query("insert into auth.users(id) values($1)", [id]);
    await db.query("update public.profiles set role=$1,status=$2 where id=$3", [
      role === "admin"
        ? "super_admin"
        : role === "ops"
          ? "operations"
          : role === "city"
            ? "city_manager"
            : "member",
      role === "disabled" ? "disabled" : "active",
      id,
    ]);
  }
  const cities = await db.query<{ id: string; slug: string }>(
    "select id,slug from public.cities",
  );
  shanghai = cities.rows.find((c) => c.slug === "shanghai")!.id;
  beijing = cities.rows.find((c) => c.slug === "beijing")!.id;
  const app = await db.query<{ id: string }>(
    `insert into public.city_applications(city_id,city_name,contact_name,contact,organization,identity,resources,experience,vision,status) values($1,'上海','测试','test@example.test','测试机构','测试','测试资源','测试经验','测试设想','approved') returning id`,
    [shanghai],
  );
  await actor(ids.admin, "select public.grant_city_member($1,$2,$3)", [
    app.rows[0].id,
    ids.city,
    "active",
  ]);
  const payload = {
    company: "权限测试企业",
    industry: "制造业",
    company_size: "50人以下",
    city_name: "上海",
    contact_name: "测试联系人",
    contact: "13800000000",
    pain_points: "测试业务痛点",
    goals: "测试业务目标",
    budget: "暂未明确",
    timeline: "先沟通了解",
  };
  for (const key of ["lead", "foreign", "unassigned"]) {
    const rows = await service<{ submit_application: string }>(
      "select public.submit_application($1,$2,$3)",
      ["enterprise", JSON.stringify(payload), key],
    );
    if (key === "lead") lead = rows[0].submit_application;
    else if (key === "foreign") foreignLead = rows[0].submit_application;
    else unassignedLead = rows[0].submit_application;
  }
  await rpc(ids.admin, "enterprise", lead, { assigned_to: ids.city });
  await db.query(
    "update public.enterprise_leads set city_id=$1,assigned_to=$2 where id=$3",
    [beijing, ids.city, foreignLead],
  );
});
afterAll(async () => {
  await db.close();
});
describe("PostgreSQL RLS and workflow security", () => {
  it("取消未发布草稿不公开，城市正式状态需真实授权", async () => {
    const draft = await rpc(ids.admin, "event", null, {
      slug: "never-published",
      title: "未公开草稿",
    });
    const id = String(draft[0].manage_record);
    await rpc(ids.admin, "event", id, { status: "cancelled" });
    expect(
      (await db.query("select * from public.public_events() where id=$1", [id]))
        .rows,
    ).toHaveLength(0);
    const created = await rpc(ids.admin, "city_config", null, {
      slug: "test-city",
      name: "测试城市",
      region: "测试区域",
      focus: "测试合作方向",
    });
    await expect(
      rpc(ids.admin, "city_config", String(created[0].manage_record), {
        status: "active",
      }),
    ).rejects.toThrow("approved city application");
    const setting = (
      await db.query<{ id: string }>(
        "select id from public.site_settings where key='home'",
      )
    ).rows[0];
    await expect(
      rpc(ids.ops, "setting", setting.id, { value: [] }),
    ).rejects.toThrow("invalid home settings");
  });

  it("普通会员无法读取任何企业线索，即使知道记录UUID", async () => {
    expect(
      await actor(ids.member, "select id from public.enterprise_leads"),
    ).toHaveLength(0);
    expect(
      await actor(
        ids.member,
        "select id from public.enterprise_leads where id=$1",
        [lead],
      ),
    ).toHaveLength(0);
  });
  it("城市负责人仅能看到本城市明确分配的线索", async () => {
    const rows = await actor<{ id: string }>(
      ids.city,
      "select id from public.enterprise_leads",
    );
    expect(rows.map((r) => r.id)).toEqual([lead]);
    expect(
      rows.some((r) => r.id === foreignLead || r.id === unassignedLead),
    ).toBe(false);
  });
  it("后台角色可访问全国记录，停用账号不能读取", async () => {
    expect(
      (await actor(ids.ops, "select id from public.enterprise_leads")).length,
    ).toBe(3);
    expect(
      await actor(ids.disabled, "select id from public.enterprise_leads"),
    ).toHaveLength(0);
  });
  it("禁止绕过RPC直接修改、提权或伪造审计", async () => {
    await expect(
      actor(
        ids.member,
        "update public.profiles set role='super_admin' where id=$1",
        [ids.member],
      ),
    ).rejects.toThrow();
    await expect(
      rpc(ids.ops, "profile", ids.member, { role: "super_admin" }),
    ).rejects.toThrow();
    await expect(
      actor(ids.admin, "delete from public.audit_logs"),
    ).rejects.toThrow();
    await expect(
      actor(ids.member, "select public.submit_application($1,$2,$3)", [
        "enterprise",
        "{}",
        "evil",
      ]),
    ).rejects.toThrow();
  });
  it("禁止跨城市更新、重新分配及状态跳级", async () => {
    await expect(
      rpc(ids.city, "enterprise", foreignLead, { status: "triaged" }),
    ).rejects.toThrow();
    await expect(
      rpc(ids.city, "enterprise", lead, { assigned_to: ids.member }),
    ).rejects.toThrow();
    await expect(
      rpc(ids.admin, "enterprise", lead, { status: "won" }),
    ).rejects.toThrow();
    await expect(
      rpc(ids.admin, "enterprise", lead, { contact: "attacker" }),
    ).rejects.toThrow();
  });
  it("合法流转和跟进记录生成不含联系方式的审计", async () => {
    await rpc(ids.city, "enterprise", lead, {
      status: "triaged",
      tags: ["测试"],
    });
    await actor(ids.city, "select public.add_lead_note($1,$2)", [
      lead,
      "完成测试初步沟通",
    ]);
    const rows = await db.query<{ changes: unknown }>(
      "select changes from public.audit_logs where record_id=$1",
      [lead],
    );
    expect(rows.rows.length).toBeGreaterThan(1);
    expect(JSON.stringify(rows.rows)).not.toContain("13800000000");
    expect(
      await actor(ids.member, "select id from public.lead_activities"),
    ).toHaveLength(0);
  });
  it("重复提交幂等，通知队列持久化", async () => {
    const existing = await service<{ submit_application: string }>(
      "select public.submit_application($1,$2,$3)",
      [
        "enterprise",
        JSON.stringify({
          company: "重复",
          industry: "制造",
          company_size: "小型",
          city_name: "上海",
          contact_name: "测试",
          contact: "13800000000",
          pain_points: "测试问题",
          goals: "测试目标",
          budget: "待定",
          timeline: "待定",
        }),
        "lead",
      ],
    );
    expect(existing[0].submit_application).toBe(lead);
    const { rows } = await db.query(
      "select id from public.notification_outbox where entity_id=$1",
      [lead],
    );
    expect(rows).toHaveLength(1);
  });
  it("原子限流跨请求生效", async () => {
    for (let i = 0; i < 5; i++) {
      const r = await service<{ consume_rate_limit: boolean }>(
        "select public.consume_rate_limit('test',5,600)",
      );
      expect(r[0].consume_rate_limit).toBe(true);
    }
    expect(
      (
        await service<{ consume_rate_limit: boolean }>(
          "select public.consume_rate_limit('test',5,600)",
        )
      )[0].consume_rate_limit,
    ).toBe(false);
  });
  it("城市申请必须逐步审批，批准前不能授权", async () => {
    const [{ submit_application: id }] = await service<{
      submit_application: string;
    }>("select public.submit_application($1,$2,$3)", [
      "city",
      JSON.stringify({
        city_name: "北京",
        contact_name: "测试",
        contact: "test@example.test",
        organization: "测试组织",
        identity: "测试身份",
        resources: "测试本地资源",
        experience: "测试活动经验",
        vision: "测试合作设想",
      }),
      "city-new",
    ]);
    await expect(
      actor(ids.admin, "select public.grant_city_member($1,$2,$3)", [
        id,
        ids.city,
        "active",
      ]),
    ).rejects.toThrow();
    for (const status of ["review", "interview", "approved"])
      await rpc(ids.ops, "city", id, { status });
    await actor(ids.admin, "select public.grant_city_member($1,$2,$3)", [
      id,
      ids.city,
      "active",
    ]);
    await rpc(ids.ops, "city", id, { status: "paused" });
    const { rows } = await db.query<{ status: string }>(
      "select status from public.city_members where application_id=$1",
      [id],
    );
    expect(rows[0].status).toBe("paused");
  });
  it("机构合作可提交、分配和跟进；普通会员无权查看", async () => {
    const [{ submit_application: id }] = await service<{
      submit_application: string;
    }>("select public.submit_application($1,$2,$3)", [
      "partner",
      JSON.stringify({
        city_name: "上海",
        contact_name: "测试",
        contact: "test@example.test",
        institution_type: "高校",
        organization: "测试机构",
        direction: "人才共建",
        resources: "测试人才资源",
        vision: "测试合作目标",
      }),
      "partner-new",
    ]);
    await rpc(ids.ops, "partner", id, {
      status: "review",
      assigned_to: ids.city,
      note: "已安排沟通",
    });
    expect(
      await actor(ids.city, "select id from public.partner_applications"),
    ).toHaveLength(1);
    expect(
      await actor(ids.member, "select id from public.partner_applications"),
    ).toHaveLength(0);
  });
  it("活动发布完整性、名额、取消、报名隔离及签到时间", async () => {
    const created = await rpc(ids.admin, "event", null, {
      slug: "test-event",
      title: "测试活动",
    });
    const id = String(created[0].manage_record);
    expect(
      (await db.query("select * from public.public_events() where id=$1", [id]))
        .rows,
    ).toHaveLength(0);
    await expect(
      rpc(ids.admin, "event", id, { status: "published" }),
    ).rejects.toThrow();
    await rpc(ids.admin, "event", id, {
      city_id: shanghai,
      assigned_to: ids.city,
      location: "测试场地",
      organizer: "测试主办",
      audience: "测试参与者",
      starts_at: "2035-01-01T10:00:00+08:00",
      ends_at: "2035-01-01T12:00:00+08:00",
      registration_deadline: "2034-12-31T23:00:00+08:00",
      capacity: 1,
      checkin_info: "私有签到口令",
      status: "published",
    });
    const pub = (
      await db.query("select * from public.public_events() where id=$1", [id])
    ).rows[0];
    expect(pub).not.toHaveProperty("checkin_info");
    expect(JSON.stringify(pub)).not.toContain("私有签到口令");
    await actor(ids.member, "select public.register_event($1,$2,$3,false)", [
      id,
      "测试成员",
      "test@example.test",
    ]);
    await expect(
      actor(ids.other, "select public.register_event($1,$2,$3,false)", [
        id,
        "其他成员",
        "other@example.test",
      ]),
    ).rejects.toThrow("event full");
    const registrations = await actor<{ id: string }>(
      ids.city,
      "select id from public.event_registrations where event_id=$1",
      [id],
    );
    expect(registrations).toHaveLength(1);
    expect(
      await actor(ids.other, "select id from public.event_registrations"),
    ).toHaveLength(0);
    await actor(ids.city, "select public.review_registration($1,$2)", [
      registrations[0].id,
      "confirmed",
    ]);
    await expect(
      actor(ids.city, "select public.review_registration($1,$2)", [
        registrations[0].id,
        "attended",
      ]),
    ).rejects.toThrow("checkin not open");
    await actor(ids.member, "select public.register_event($1,$2,$3,true)", [
      id,
      "",
      "",
    ]);
    await actor(ids.other, "select public.register_event($1,$2,$3,false)", [
      id,
      "其他成员",
      "other@example.test",
    ]);
    await rpc(ids.admin, "event", id, { status: "cancelled" });
    expect(
      (
        await actor<{ status: string }>(
          ids.other,
          "select status from public.event_registrations where event_id=$1",
          [id],
        )
      )[0].status,
    ).toBe("cancelled");
  });
  it("不允许未经同意公开负责人或专家资料", async () => {
    await expect(
      rpc(ids.admin, "city_config", shanghai, {
        leader_name: "未经授权姓名",
        leader_consent: false,
      }),
    ).rejects.toThrow();
    await expect(
      db.query(
        "insert into public.expert_profiles(display_name,bio,status) values('测试','测试简介','approved')",
      ),
    ).rejects.toThrow();
  });
  it("数据留存清理同步删除跟进，审计无敏感正文", async () => {
    await db.query(
      "update public.enterprise_leads set retention_until=now()-interval '1 day' where id=$1",
      [lead],
    );
    await service("select public.purge_expired_data()");
    expect(
      (
        await db.query("select id from public.enterprise_leads where id=$1", [
          lead,
        ])
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          "select id from public.lead_activities where lead_id=$1",
          [lead],
        )
      ).rows,
    ).toHaveLength(0);
  });
});
