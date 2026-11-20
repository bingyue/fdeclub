import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "./header";
export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Brand />
            <p className="footer-intro">
              连接真实需求，汇聚实战力量。
              <br />
              让企业AI转型，在每一座城市真实发生。
            </p>
            <span className="footer-signal">
              <i /> BUILDING TOGETHER, LOCALLY.
            </span>
          </div>
          <div>
            <h3>参与共创</h3>
            {[
              ["/cities", "城市共建"],
              ["/enterprise", "企业AI需求"],
              ["/partners", "产业机构合作"],
              ["/events", "产业活动"],
            ].map(([url, name]) => (
              <Link href={url} key={url}>
                {name}
              </Link>
            ))}
          </div>
          <div>
            <h3>了解俱乐部</h3>
            {[
              ["/membership", "会员计划"],
              ["/experts", "专家协作"],
              ["/book", "图书与作者"],
              ["/about", "关于我们"],
              ["/login", "账号登录"],
              ["/admin", "运营后台"],
            ].map(([url, name]) => (
              <Link href={url} key={url}>
                {name}
              </Link>
            ))}
          </div>
          <div>
            <h3>FDE 品牌生态</h3>
            {[
              ["https://fdeopen.com", "FDEOpen", "产业媒体"],
              ["https://fdechina.ai", "FDEChina", "专业社区"],
              ["https://51fde.net", "51FDE", "项目协作"],
            ].map(([url, name, note]) => (
              <a href={url} target="_blank" rel="noopener noreferrer" key={url}>
                {name}
                <small>{note}</small>
                <ArrowUpRight size={13} />
              </a>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} FDE Club · 产业共创网络</span>
          <div>
            <Link href="/privacy">隐私政策</Link>
            <Link href="/terms">服务条款</Link>
            {process.env.ICP_NUMBER && (
              <a
                href="https://beian.miit.gov.cn"
                target="_blank"
                rel="noopener noreferrer"
              >
                {process.env.ICP_NUMBER}
              </a>
            )}
            {process.env.PUBLIC_SECURITY_NUMBER &&
              process.env.PUBLIC_SECURITY_URL?.startsWith(
                "https://beian.mps.gov.cn/",
              ) && (
                <a
                  href={process.env.PUBLIC_SECURITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {process.env.PUBLIC_SECURITY_NUMBER}
                </a>
              )}
          </div>
        </div>
      </div>
    </footer>
  );
}
