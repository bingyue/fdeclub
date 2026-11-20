import { PageHero, ButtonLink } from "@/components/ui";
import { ApplicationForm } from "@/components/application-form";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "企业AI需求征集",
  "从真实业务痛点出发，提交企业AI需求，开展初步场景诊断与PoC路径讨论。",
  "/enterprise",
);
export default function Enterprise() {
  return (
    <>
      <PageHero
        eyebrow="ENTERPRISE AI OPPORTUNITIES"
        title="先把问题说清楚，再让AI发挥价值。"
        description="不是每个问题都需要一个新模型。我们从你的业务现场出发，一起判断什么值得做、从哪里开始，以及怎样验证价值。"
      >
        <ButtonLink href="#apply">提交企业AI需求</ButtonLink>
      </PageHero>
      <section className="section wrap form-layout">
        <aside className="form-aside">
          <span className="eyebrow">A PRACTICAL FIRST STEP</span>
          <h2>
            从真实问题，
            <br />
            走向清晰路径。
          </h2>
          <p>
            面向制造、外贸、电商、零售、供应链及专业服务等行业，征集可讨论、可验证的企业AI场景。
          </p>
          <ol className="vertical-steps">
            {[
              ["提交需求", "描述业务痛点、目标与现有条件"],
              ["初步评估", "判断价值、可行性与数据准备"],
              ["组织诊断", "匹配合适的行业与技术专家"],
              ["明确下一步", "讨论PoC建议或项目合作方向"],
            ].map(([a, b], i) => (
              <li key={a}>
                <span>0{i + 1}</span>
                <div>
                  <strong>{a}</strong>
                  <p>{b}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="aside-note">
            初步沟通不承诺免费PoC或商业实施。具体服务范围、费用与周期另行确认。
          </div>
        </aside>
        <ApplicationForm kind="enterprise" />
      </section>
    </>
  );
}
