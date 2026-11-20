import { PageHero, SectionHeading, ButtonLink } from "@/components/ui";
import { ApplicationForm } from "@/components/application-form";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "会员计划",
  "登记FDE Club会员意向，参与产业交流、城市活动与专业共创。首期不开放在线收费。",
  "/membership",
);
export default function Membership() {
  return (
    <>
      <PageHero
        eyebrow="BELONG TO THE PRACTICE"
        title="与愿意做实事的人，一起向前。"
        description="围绕专业实践、产业交流与城市协作，建立有价值的长期连接。当前开放意向登记，具体权益以正式审核方案为准。"
      />
      <section className="section wrap">
        <SectionHeading
          eyebrow="WAYS TO PARTICIPATE"
          title="找到适合你的参与方式"
        />
        <div className="grid-3">
          {[
            [
              "注册会员",
              "从一次交流开始",
              [
                "了解公开产业活动",
                "参与符合条件的公开交流",
                "连接城市与专业资源",
              ],
            ],
            [
              "年度会员意向",
              "持续参与专业实践",
              [
                "主题交流与专题活动规划",
                "实战案例与方法讨论规划",
                "长期共创参与机会",
              ],
            ],
            [
              "产业伙伴",
              "围绕共同目标协作",
              ["联合策划产业活动", "企业场景诊断合作", "人才与城市共建方案"],
            ],
          ].map(([name, desc, items], i) => (
            <div
              className={`plan-card ${i === 1 ? "plan-featured" : ""} reveal`}
              key={String(name)}
            >
              <span className="eyebrow">0{i + 1} / PARTICIPATE</span>
              <h3>{name}</h3>
              <p>{desc}</p>
              <strong className="plan-price">
                {i === 0 ? "免费登记" : i === 1 ? "意向登记" : "合作申请"}
                <small>当前不开放收款</small>
              </strong>
              <ul className="check-list">
                {(items as string[]).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <ButtonLink
                href={i === 2 ? "/partners#apply" : "#apply"}
                secondary={i !== 1}
              >
                {i === 2 ? "申请机构合作" : "登记会员意向"}
              </ButtonLink>
            </div>
          ))}
        </div>
        <p className="section-note">
          意向登记不自动授予付费权益。会员期限与权益需要后台审核确认；收费将在订单、支付、合同、发票与退款规则准备完成后另行公布。
        </p>
      </section>
      <section className="section wrap form-wrap">
        <ApplicationForm kind="membership" />
      </section>
    </>
  );
}
