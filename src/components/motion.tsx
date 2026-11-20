"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Pause, Play, Accessibility } from "lucide-react";
import { toggleMotion, useMotionPreference } from "@/lib/motion-preference";
export function Motion() {
  const path = usePathname();
  const preference = useMotionPreference();
  useEffect(() => {
    document.documentElement.dataset.motion = preference;
    if (preference !== "full") return;
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          const index = Number(element.dataset.revealIndex || 0);
          const animation = element.animate(
            [
              { opacity: 0, transform: "translateY(38px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 850,
              delay: Math.min(index * 85, 340),
              fill: "backwards",
              easing: "cubic-bezier(.16,1,.3,1)",
            },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
          observer.unobserve(element);
        });
      },
      { threshold: 0.08 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    let frame = 0;
    let lastCard: HTMLElement | null = null;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !(event.target instanceof Element))
        return;
      const card = event.target.closest<HTMLElement>(
        ".spotlight, [data-magnetic]",
      );
      if (lastCard && lastCard !== card) {
        lastCard.style.removeProperty("--tilt-x");
        lastCard.style.removeProperty("--tilt-y");
      }
      lastCard = card;
      cancelAnimationFrame(frame);
      if (!card) return;
      frame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        card.style.setProperty("--mx", `${x}px`);
        card.style.setProperty("--my", `${y}px`);
        card.style.setProperty("--tilt-x", `${(0.5 - y / rect.height) * 4}deg`);
        card.style.setProperty("--tilt-y", `${(x / rect.width - 0.5) * 4}deg`);
      });
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => {
      observer.disconnect();
      animations.forEach((a) => a.cancel());
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", move);
      document
        .querySelectorAll<HTMLElement>(".spotlight, [data-magnetic]")
        .forEach((el) => {
          el.style.removeProperty("--tilt-x");
          el.style.removeProperty("--tilt-y");
        });
    };
  }, [path, preference]);
  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <button
        className="motion-toggle"
        type="button"
        onClick={toggleMotion}
        disabled={preference === "reduced"}
        aria-label={
          preference === "reduced"
            ? "已遵循系统减少动态效果设置"
            : preference === "paused"
              ? "开启动效"
              : "暂停动效"
        }
        aria-pressed={preference !== "full"}
      >
        {preference === "reduced" ? (
          <Accessibility size={14} />
        ) : preference === "paused" ? (
          <Play size={14} />
        ) : (
          <Pause size={14} />
        )}
        <span>
          {preference === "reduced"
            ? "静态浏览"
            : preference === "paused"
              ? "开启动效"
              : "暂停动效"}
        </span>
      </button>
    </>
  );
}
