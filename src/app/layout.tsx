import type { Metadata, Viewport } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Motion } from "@/components/motion";
import { siteUrl } from "@/lib/seo";
import "./globals.css";
import "./motion.css";
import "./theme.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FDE Club｜让企业AI转型，在每一座城市真实发生",
    template: "%s｜FDE Club",
  },
  description:
    "FDE前线产业共创俱乐部，连接企业AI需求、实战专家、城市伙伴与产业资源。",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "FDE Club",
    images: ["/og.png"],
  },
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = {
  themeColor: "#0a1120",
  width: "device-width",
  initialScale: 1,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          跳到主要内容
        </a>
        <Motion />
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
