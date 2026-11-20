import { describe, it, expect } from "vitest";
import { schemas, patchSchemas, csvCell } from "../src/lib/validation";
describe("Business input boundaries", () => {
  const enterprise = {
    company: "测试企业",
    industry: "制造业",
    company_size: "50人以下",
    contact_name: "测试联系人",
    contact: "13800000000",
    city_name: "上海",
    pain_points: "客服查询时间较长",
    goals: "希望缩短响应时间",
    budget: "暂未明确",
    timeline: "先沟通了解",
    consent: true,
  };
  it("三种P0输入校验支持有效内容", () => {
    expect(schemas.enterprise.safeParse(enterprise).success).toBe(true);
    expect(
      schemas.city.safeParse({
        ...enterprise,
        organization: "测试机构",
        identity: "企业负责人",
        resources: "本地企业资源",
        experience: "活动组织经验",
        vision: "希望共同推进",
      }).success,
    ).toBe(true);
    expect(
      schemas.partner.safeParse({
        ...enterprise,
        institution_type: "园区",
        organization: "测试机构",
        direction: "产业活动",
        resources: "活动场地资源",
        vision: "希望共同推进",
      }).success,
    ).toBe(true);
  });
  it("拒绝无同意、无效联系方式、过长内容和机器人诱捕字段", () => {
    for (const patch of [
      { consent: false },
      { contact: "123" },
      { pain_points: "x".repeat(4001) },
      { website: "spam" },
    ])
      expect(
        schemas.enterprise.safeParse({ ...enterprise, ...patch }).success,
      ).toBe(false);
  });
  it("去掉公开请求中的角色或负责人字段", () => {
    const parsed = schemas.enterprise.parse({
      ...enterprise,
      role: "super_admin",
      assigned_to: "anything",
    });
    expect(parsed).not.toHaveProperty("role");
    expect(parsed).not.toHaveProperty("assigned_to");
  });
  it("后台字段白名单拒绝联系方式覆写和危险URL", () => {
    expect(
      patchSchemas.enterprise.safeParse({ contact: "overwrite" }).success,
    ).toBe(false);
    expect(
      patchSchemas.event.safeParse({ poster_url: "javascript:alert(1)" })
        .success,
    ).toBe(false);
  });
  it("CSV防公式注入并保留引号和换行", () => {
    expect(csvCell("=SUM(1,2)")).toBe('"\'=SUM(1,2)"');
    expect(csvCell("  +cmd")).toBe('"\'  +cmd"');
    expect(csvCell('a"b\nc')).toBe('"a""b\nc"');
  });
});
