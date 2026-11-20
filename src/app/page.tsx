import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Network as NetworkIcon,
  Landmark,
  MoveDown,
  Globe2,
} from "lucide-react";
import { ProcessJourney } from "@/components/process-journey";
import { BookFeature } from "@/components/publication";
import { Network } from "@/components/network";
import {
  ButtonLink,
  SectionHeading,
  JoinCTA,
  EmptyState,
} from "@/components/ui";
import { CityCard, EventCard } from "@/components/listings";
import { getCities, getEvents, getHomeSettings } from "@/lib/data";
import { metadata as makeMetadata } from "@/lib/seo";
export const metadata = makeMetadata(
  "让企业AI转型，在每一座城市真实发生",
  "连接企业需求、FDE实战专家、城市共建伙伴和产业资源。申请城市共建、提交企业AI需求，发起产业合作。",
  "/",
);
export const revalidate = 60;
export default async function Home() {
  const [cities, events, settings] = await Promise.all([
    getCities(),
    getEvents(),
    getHomeSettings(),
  ]);
  const upcoming = events
    .filter((e) => e.status === "published" && new Date(e.ends_at) > new Date())
    .slice(0, 3);
  return (
    <div className="experience-home">
      <section className="home-hero wrap">
        <div className="hero-shell">
          <div className="hero-grain" />
          <div className="hero-copy">
            <div className="hero-badge">
              <i />
              {settings.eyebrow}
              <ArrowUpRight size={13} />
            </div>
            <span className="hero-kicker">
              FORWARD DEPLOYED. LOCALLY CONNECTED.
            </span>
            <h1 className="kinetic-title">
              <span className="title-line">
                <span>让企业AI转型，</span>
              </span>
              <span className="title-line">
                <span>在每一座城市</span>
              </span>
              <span className="title-line title-emphasis">
                <em>
                  真实发生<span className="title-period">。</span>
                </em>
              </span>
            </h1>
            <p>{settings.description}</p>
            <div className="hero-actions">
              <ButtonLink href="/cities#apply">申请城市共建</ButtonLink>
              <ButtonLink href="/enterprise" secondary>
                提交企业AI需求
              </ButtonLink>
            </div>
            <div className="hero-promises">
              <span>
                <i />
                真实需求
              </span>
              <span>本地连接</span>
              <span>共同实践</span>
            </div>
          </div>
          <div className="hero-visual">
            <Network cities={cities} />
          </div>
          <div className="hero-baseline">
            <span>FDE CLUB / 产业共创，从这里出发</span>
            <a href="#co-create" className="hero-scroll-cue">
              SCROLL TO EXPLORE <MoveDown size={14} />
            </a>
          </div>
        </div>
      </section>
      <div
        className="signal-ribbon"
        role="img"
        aria-label="真实需求、实战力量、共同创造"
      >
        <div className="signal-track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div className="signal-group" key={copy}>
              <span>REAL NEEDS.</span>
              <i>↗</i>
              <span>REAL PEOPLE.</span>
              <i>✳</i>
              <span>REAL IMPACT.</span>
              <i>↗</i>
            </div>
          ))}
        </div>
      </div>
      <section className="section wrap entry-section" id="co-create">
        <SectionHeading
          eyebrow="01 / START WITH A REAL NEED"
          title="找到你的共创入口"
          description="从企业的一个问题、一座城市的连接，到一群人的共同实践。每一种参与，都有清晰的下一步。"
        />
        <div className="grid-3 service-grid">
          {[
            {
              icon: NetworkIcon,
              n: "01",
              title: "成为城市共建伙伴",
              en: "CITY CO-BUILDERS",
              text: "连接本地企业、专家与产业资源，把AI实践带到你所在的城市。",
              href: "/cities",
              cta: "了解城市共建",
            },
            {
              icon: Building2,
              n: "02",
              title: "提出企业AI需求",
              en: "ENTERPRISE OPPORTUNITIES",
              text: "从具体业务痛点出发，一起判断场景价值、数据条件和可行的落地路径。",
              href: "/enterprise",
              cta: "提交真实需求",
            },
            {
              icon: Landmark,
              n: "03",
              title: "发起产业机构合作",
              en: "ECOSYSTEM PARTNERS",
              text: "联合园区、高校和行业组织，以活动、人才与场景共创推动区域协作。",
              href: "/partners",
              cta: "探讨合作方向",
            },
          ].map((x) => (
            <Link
              href={x.href}
              className="service-card spotlight reveal"
              key={x.n}
              data-reveal-index={Number(x.n) - 1}
              data-card-number={x.n}
            >
              <div className="service-top">
                <span>{x.n} /</span>
                <x.icon size={28} strokeWidth={1.4} />
              </div>
              <div>
                <span className="micro-label">{x.en}</span>
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </div>
              <div className="service-link">
                {x.cta}
                <span>
                  <ArrowUpRight size={19} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="city-section">
        <div className="wrap">
          <SectionHeading
            eyebrow="02 / BUILT LOCALLY, CONNECTED TOGETHER"
            title="一座城市，一种共创可能"
            description="我们正在寻找愿意长期投入的城市伙伴。从小规模交流和具体企业需求开始，逐步建立本地协作。"
          />
          <div className="city-section-meta">
            <span>
              <Globe2 size={16} /> CITY CO-CREATION NETWORK
            </span>
            <Link className="text-link" href="/cities">
              探索全部城市
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="grid-3">
            {cities.slice(0, 6).map((city, i) => (
              <div className="reveal" data-reveal-index={i % 3} key={city.slug}>
                <CityCard city={city} index={i} />
              </div>
            ))}
          </div>
          <p className="section-note">
            城市卡片表示公开招募方向。正式合作状态、负责人及活动，以审核后的城市主页为准。
          </p>
        </div>
      </section>
      <ProcessJourney />
      <section className="impact-section">
        <div className="wrap impact-layout">
          <div className="reveal">
            <span className="eyebrow">LESS HYPE. MORE REAL WORK.</span>
            <h2>
              技术向前一步，
              <br />
              产业更近一步。
            </h2>
            <p>
              FDE的价值发生在真实业务现场。我们希望把企业的需求、专家的实践和城市的资源连接起来，让合作有起点、有边界，也有下一步。
            </p>
            <Link href="/about" className="text-link">
              了解 FDE Club
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="impact-diagram reveal">
            <div className="impact-orbital" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <div className="impact-word">
              FORWARD
              <br />
              <span>TOGETHER.</span>
            </div>
            <div className="impact-labels">
              <span>业务现场</span>
              <i />
              <span>专业实践</span>
              <i />
              <span>产业协同</span>
            </div>
          </div>
        </div>
      </section>
      {settings.show_events && (
        <section className="section wrap">
          <SectionHeading
            eyebrow="04 / MEET IN THE REAL WORLD"
            title="好的合作，从面对面开始"
            link={{ href: "/events", label: "查看产业活动" }}
          />
          {upcoming.length ? (
            <div className="grid-3">
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} cities={cities} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="下一场相遇，正在酝酿"
              description="企业沙龙、城市Meetup、场景共创工作坊。具体活动将在时间与场地确认后发布，欢迎共同策划。"
              href="/partners#apply"
              label="成为活动共建伙伴"
            />
          )}
        </section>
      )}
      <BookFeature />
      <JoinCTA />
    </div>
  );
}
