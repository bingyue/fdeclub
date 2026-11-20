import { PageHero, ButtonLink, SectionHeading } from "@/components/ui";
import { ApplicationForm } from "@/components/application-form";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "专家协作中心",
  "面向具有真实行业和AI交付经验的专家，申请加入FDE Club产业共创网络。",
  "/experts",
);
export default function Experts() {
  return (
    <>
      <PageHero
        eyebrow="EXPERT COLLABORATION"
        title="让你的专业，被真实的场景需要。"
        description="欢迎具有行业经验和AI交付实践的专家，共同参与场景诊断、产业交流与项目共创。以可验证的经历，建立专业信任。"
      >
        <ButtonLink href="#apply">申请加入专家网络</ButtonLink>
      </PageHero>
      <section className="section wrap">
        <SectionHeading
          eyebrow="DOMAINS OF PRACTICE"
          title="多种能力，同一个业务现场"
          description="以下为合作能力方向，不代表现有专家数量或已获得任何认证。"
        />
        <div className="grid-3">
          {[
            ["业务与行业咨询", "制造、电商、供应链、外贸等行业的场景分析。"],
            ["Agent与AI应用工程", "RAG、Agent、工作流与企业AI应用工程实施。"],
            ["企业系统集成", "ERP、CRM、MES、数据与权限体系对接。"],
            ["交付与解决方案", "企业诊断、PoC评估、实施验收与业务采用。"],
            ["AI战略与组织", "经营价值评估、组织协作与转型路径设计。"],
            ["产业培训与活动", "实战教学、案例工作坊与人才能力共建。"],
          ].map(([a, b], i) => (
            <div className="feature-card reveal" key={a}>
              <span className="feature-number">0{i + 1}</span>
              <h3>{a}</h3>
              <p>{b}</p>
            </div>
          ))}
        </div>
        <div className="notice">
          加入流程：提交材料 → 资料审核 → 专业交流 →
          确认协作范围。未经审核与本人授权，不公开专家资料或案例。
        </div>
      </section>
      <section className="section wrap form-wrap">
        <ApplicationForm kind="expert" />
      </section>
    </>
  );
}
