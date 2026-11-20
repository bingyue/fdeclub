import { PageHero, SectionHeading, JoinCTA } from "@/components/ui";
import { AuthorProfile } from "@/components/publication";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "关于FDE Club",
  "了解FDE前线产业共创俱乐部的定位、品牌矩阵，以及《FDE前线部署工程师》作者邴越的实践背景。",
  "/about",
);
export default function About() {
  return (
    <>
      <PageHero
        eyebrow="ABOUT FDE CLUB"
        title="连接人与产业，让AI走进真实世界。"
        description="FDE Club｜FDE前线产业共创俱乐部，是面向企业、专家、城市共建伙伴与产业机构的业务入口。我们关注有明确需求、务实分工与可验证价值的合作。"
      />
      <section className="section wrap">
        <div className="manifesto reveal">
          <span className="eyebrow">OUR CONVICTION</span>
          <h2>
            真正的转型，
            <br />
            发生在业务现场。
          </h2>
          <p>
            技术创造可能，实践创造价值。我们希望在每一座城市连接理解业务的人、擅长技术的人和愿意组织资源的人，从具体问题开始，让产业共创持续发生。
          </p>
        </div>
      </section>
      <AuthorProfile />
      <section className="section-soft">
        <div className="wrap">
          <SectionHeading
            eyebrow="ONE ECOSYSTEM, CLEAR RESPONSIBILITIES"
            title="各有专注，彼此连接"
          />
          <div className="grid-4">
            {[
              [
                "https://fdeopen.com",
                "FDEOpen.com",
                "产业媒体",
                "行业资讯、研究与深度内容",
              ],
              [
                "https://fdechina.ai",
                "FDEChina.ai",
                "专业社区",
                "学习资源、知识与方法论",
              ],
              [
                "https://fdeclub.net",
                "FDEClub.net",
                "产业共创",
                "会员、城市、活动与合作入口",
              ],
              [
                "https://51fde.net",
                "51FDE.net",
                "项目协作",
                "人才对接、项目交付与协同",
              ],
            ].map(([href, domain, name, desc]) => (
              <a
                href={href}
                key={domain}
                className="feature-card"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="eyebrow">{domain}</span>
                <h3>
                  {name}
                  <ArrowUpRight size={18} />
                </h3>
                <p>{desc}</p>
              </a>
            ))}
          </div>
          <p className="section-note">
            各站按职责协作。企业线索、专家身份与项目记录以授权的统一业务记录为准，跨站使用前另行确认授权。
          </p>
        </div>
      </section>
      <section className="section wrap">
        <SectionHeading
          eyebrow="GET IN TOUCH"
          title="用一个具体想法，开启对话"
        />
        <div className="grid-3">
          {[
            ["/enterprise#apply", "我有企业AI需求"],
            ["/cities#apply", "我想参与城市共建"],
            ["/partners#apply", "我代表产业机构"],
          ].map(([href, text]) => (
            <Link key={href} className="contact-link" href={href}>
              {text}
              <ArrowUpRight size={20} />
            </Link>
          ))}
        </div>
        {process.env.CONTACT_EMAIL && (
          <p className="section-note">
            业务联系：
            <a href={`mailto:${process.env.CONTACT_EMAIL}`}>
              {process.env.CONTACT_EMAIL}
            </a>
          </p>
        )}
      </section>
      <JoinCTA />
    </>
  );
}
