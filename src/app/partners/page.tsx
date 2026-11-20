import { PageHero, ButtonLink, SectionHeading } from "@/components/ui";
import { ApplicationForm } from "@/components/application-form";
import { Building2, GraduationCap, CalendarDays, Network } from "lucide-react";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "产业机构合作",
  "面向产业园区、高校、行业组织和企业服务机构，联合开展企业诊断、产业活动、人才与城市共建。",
  "/partners",
);
export default function Partners() {
  return (
    <>
      <PageHero
        eyebrow="ECOSYSTEM PARTNERSHIPS"
        title="与产业同行，把资源变成共同实践。"
        description="连接园区、行业组织、高校与企业服务机构。围绕区域产业的真实需求，找到可以一起推进的具体事情。"
      >
        <ButtonLink href="#apply">发起产业合作</ButtonLink>
      </PageHero>
      <section className="section wrap">
        <SectionHeading
          eyebrow="FOUR WAYS TO CO-CREATE"
          title="合作从具体方向开始"
        />
        <div className="grid-4">
          {[
            [
              Building2,
              "企业AI转型服务",
              "组织企业场景发现、业务诊断与PoC需求讨论。",
            ],
            [
              GraduationCap,
              "人才与能力共建",
              "开展实战工作坊、方法论交流与企业人才培养。",
            ],
            [
              CalendarDays,
              "产业活动联合举办",
              "以真实案例与行业议题，策划沙龙、论坛和交流。",
            ],
            [
              Network,
              "城市生态伙伴",
              "连接本地企业、专家和交付团队，推动长期协作。",
            ],
          ].map(([Icon, title, text]) => {
            const I = Icon as typeof Building2;
            return (
              <div className="feature-card reveal" key={String(title)}>
                <I size={28} strokeWidth={1.4} />
                <h3>{String(title)}</h3>
                <p>{String(text)}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="section-soft">
        <div className="wrap grid-2">
          <div>
            <span className="eyebrow">YOUR RESOURCES</span>
            <h2>带来需求，也带来可能。</h2>
            <p>
              真实的企业场景、行业组织能力、活动场地、人才资源或专业实践，都可以成为合作起点。
            </p>
          </div>
          <div>
            <span className="eyebrow">OUR COLLABORATION</span>
            <h2>共议目标，共担分工。</h2>
            <p>
              围绕活动策划、初步诊断、专家匹配与项目共创，逐项约定目标、成果、周期与责任。机构参与不代表官方认证或背书。
            </p>
          </div>
        </div>
      </section>
      <section className="section wrap form-wrap">
        <ApplicationForm kind="partner" />
      </section>
    </>
  );
}
