import Link from "next/link";
import { ArrowUpRight, ArrowRight, Compass } from "lucide-react";
import type { ReactNode } from "react";
export function ButtonLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      className={`button ${secondary ? "button-secondary" : ""}`}
      href={href}
    >
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="page-hero">
      <div className="wrap">
        <div className="eyebrow">
          <span />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
        {children && <div className="hero-actions">{children}</div>}
        <div className="page-orbit" aria-hidden="true" />
      </div>
    </section>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  link,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="section-heading reveal">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {description && <p>{description}</p>}
      {link && (
        <Link className="text-link" href={link.href}>
          {link.label}
          <ArrowUpRight size={18} />
        </Link>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Compass size={30} strokeWidth={1.3} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {href && (
        <Link className="text-link" href={href}>
          {label || "了解更多"}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function JoinCTA() {
  return (
    <section className="wrap section">
      <div className="join-cta reveal">
        <div>
          <span className="eyebrow">YOUR NEXT MOVE</span>
          <h2>
            下一次改变，
            <br />
            从一次真实的连接开始。
          </h2>
          <p>带着你的业务问题、专业能力或城市资源，加入共创。</p>
        </div>
        <div className="join-links">
          {[
            ["/cities#apply", "成为城市共建伙伴"],
            ["/enterprise#apply", "聊聊企业AI需求"],
            ["/partners#apply", "发起产业机构合作"],
          ].map(([href, label], i) => (
            <Link key={href} href={href}>
              <span>
                <small>0{i + 1}</small>
                {label}
              </span>
              <ArrowUpRight size={22} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
