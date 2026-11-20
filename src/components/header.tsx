"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { navItems } from "@/lib/catalog";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="FDE Club 首页">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" focusable="false">
          <path d="M14 49V16H34V24H23V30H33V38H23V49H14Z" fill="currentColor" />
          <path
            d="M39 16H50V27M49 17L36 30"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <circle cx="44" cy="44" r="5" className="brand-signal" />
        </svg>
      </span>
      <span className="brand-word">
        <span className="brand-name">
          <strong>FDE</strong>
          <span>CLUB</span>
        </span>
        <small>FDE前线产业共创俱乐部</small>
      </span>
    </Link>
  );
}
export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <>
      <div className="topline">
        <div className="wrap">
          <span>FROM REAL NEEDS. TO REAL IMPACT.</span>
          <Link href="/cities">
            城市共建计划，正在发生 <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
      <header className="header">
        <div className="wrap header-inner">
          <Brand />
          <nav aria-label="主导航" className="desktop-nav">
            {navItems.map(([href, label]) => (
              <Link
                aria-current={path.startsWith(href) ? "page" : undefined}
                key={href}
                href={href}
              >
                {label}
              </Link>
            ))}
          </nav>
          <Link className="nav-cta" href="/membership">
            加入共创
            <ArrowUpRight size={16} />
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-label={open ? "关闭导航" : "打开导航"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        <nav
          id="mobile-navigation"
          aria-label="移动导航"
          className={`mobile-nav ${open ? "is-open" : ""}`}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          {[
            ["/", "首页"],
            ...navItems,
            ["/membership", "会员计划"],
            ["/about", "关于我们"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={path === href ? "page" : undefined}
            >
              {label}
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
