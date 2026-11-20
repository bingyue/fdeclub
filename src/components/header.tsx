"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { navItems } from "@/lib/catalog";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="FDE Club 首页">
      <span className="brand-mark">
        f<span>de</span>
        <i />
      </span>
      <span className="brand-word">
        FDE CLUB<small>FDE前线产业共创俱乐部</small>
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
