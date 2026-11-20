"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useMotionPreference } from "@/lib/motion-preference";
const steps = [
  {
    title: "发现需求",
    en: "DISCOVER",
    text: "从经营问题和业务现场出发，明确真正需要改善的环节。",
    tags: ["真实问题", "业务场景"],
    detail: "让一个具体问题，成为共创的起点。",
  },
  {
    title: "共同诊断",
    en: "DEFINE",
    text: "梳理场景价值、数据条件与组织准备，判断可行性。",
    tags: ["价值判断", "数据准备"],
    detail: "先对齐什么值得做，再讨论怎样做。",
  },
  {
    title: "连接专家",
    en: "CONNECT",
    text: "按行业、能力与合作范围，匹配合适的实战力量。",
    tags: ["行业经验", "能力匹配"],
    detail: "把合适的人，带到真实的业务现场。",
  },
  {
    title: "形成试点",
    en: "BUILD",
    text: "讨论PoC目标、资源投入、验收方式与阶段边界。",
    tags: ["小步验证", "明确边界"],
    detail: "把一个想法，变成可以验证的实践。",
  },
  {
    title: "推进协作",
    en: "GROW",
    text: "在明确分工后进入交付协作，持续验证业务价值。",
    tags: ["协同交付", "持续验证"],
    detail: "让每一次实践，走向下一步改变。",
  },
];
export function ProcessJourney() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const preference = useMotionPreference();
  useEffect(() => {
    const cards = Array.from(
      root.current?.querySelectorAll<HTMLElement>(".journey-step") || [],
    );
    let frame = 0;
    const update = () => {
      frame = 0;
      const center = window.innerHeight * 0.48;
      let next = 0,
        nearest = Infinity;
      for (const [i, card] of cards.entries()) {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - center);
        if (distance < nearest) {
          nearest = distance;
          next = i;
        }
      }
      setActive((previous) => (previous === next ? previous : next));
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener("scroll", scroll, { passive: true });
        scroll();
      } else window.removeEventListener("scroll", scroll);
    });
    if (root.current) observer.observe(root.current);
    window.addEventListener("resize", scroll, { passive: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
    };
  }, []);
  return (
    <section
      ref={root}
      className="journey-section"
      id="how-it-happens"
      aria-labelledby="journey-heading"
    >
      <div className="wrap journey-layout">
        <div className="journey-sticky">
          <span className="eyebrow">03 / FROM CONNECTION TO ACTION</span>
          <h2 id="journey-heading">
            每一步，
            <br />
            更接近<span>真实改变。</span>
          </h2>
          <p className="journey-intro">
            从一场对话，到一次共同实践。
            <br />
            围绕实际业务价值，走好每一步。
          </p>
          <div
            className="journey-instrument"
            aria-hidden="true"
            style={
              { "--journey-turn": `${active * 72}deg` } as React.CSSProperties
            }
          >
            <div className="journey-ring" />
            <div className="journey-ring-inner" />
            <div className="journey-readout">
              <span>0{active + 1}</span>
              <small>{steps[active].en}</small>
            </div>
            <div className="journey-orbit-dot" />
          </div>
          <nav className="journey-nav" aria-label="合作流程阶段">
            {steps.map((step, i) => (
              <button
                type="button"
                key={step.en}
                aria-current={i === active ? "step" : undefined}
                onClick={() =>
                  root.current
                    ?.querySelector(`#journey-step-${i}`)
                    ?.scrollIntoView({
                      behavior: preference === "full" ? "smooth" : "instant",
                      block: "center",
                    })
                }
              >
                <span>0{i + 1}</span>
                <span className="sr-only">{step.title}</span>
              </button>
            ))}
          </nav>
          <span className="journey-scroll">
            <ArrowDown size={13} />
            向下探索合作过程
          </span>
        </div>
        <div className="journey-steps">
          {steps.map((step, i) => (
            <article
              className={`journey-step ${active === i ? "is-active" : ""}`}
              id={`journey-step-${i}`}
              key={step.en}
            >
              <div className="journey-step-meta">
                <span>STEP 0{i + 1}</span>
                <span>{step.en} ↗</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <div className="journey-tags">
                {step.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <p className="journey-detail">{step.detail}</p>
            </article>
          ))}
          <Link href="/enterprise" className="journey-start">
            从你的一个业务问题开始
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
