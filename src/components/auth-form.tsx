"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
export function AuthForm({
  callbackError = false,
  emailEnabled = true,
}: {
  callbackError?: boolean;
  emailEnabled?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "email">("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    callbackError ? "登录链接已失效，请重新申请。" : "",
  );
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, mode, consent: data.consent === "on" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      if (body.redirect) {
        router.push(body.redirect);
        router.refresh();
      } else setMessage(body.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络异常，请重试。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="form-card">
      <div className="auth-tabs">
        <button
          aria-pressed={mode === "password"}
          onClick={() => setMode("password")}
        >
          账号密码
        </button>
        {emailEnabled && (
          <button
            aria-pressed={mode === "email"}
            onClick={() => setMode("email")}
          >
            邮箱登录 / 注册
          </button>
        )}
      </div>
      <form onSubmit={submit} className="auth-form">
        <div className="field">
          <label htmlFor="email">邮箱</label>
          <input
            id="email"
            type="email"
            name="email"
            required
            autoComplete="email"
          />
        </div>
        {mode === "password" ? (
          <div className="field">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              name="password"
              minLength={8}
              required
              autoComplete="current-password"
            />
          </div>
        ) : (
          <label className="checkbox">
            <input type="checkbox" name="consent" required />
            <span>
              我同意<Link href="/privacy">隐私政策</Link>和
              <Link href="/terms">服务条款</Link>
              。首次登录将创建普通会员账号，不授予运营权限。
            </span>
          </label>
        )}
        {error && (
          <div role="alert" className="form-error">
            {error}
          </div>
        )}
        {message && (
          <p role="status" className="save-result">
            {message}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? "正在处理…" : mode === "password" ? "登录" : "发送登录链接"}
        </button>
        <p className="subtle">
          {emailEnabled
            ? "运营账号由管理员分配权限。忘记密码可使用邮箱登录；如需重置密码，请联系站点管理员。"
            : "运营账号由管理员分配。邮箱自助注册暂未开放；合作申请和会员意向登记无需登录。如需账号帮助，请联系站点管理员。"}
        </p>
      </form>
    </div>
  );
}
export function Logout() {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <div>
      <button
        className="small-button"
        onClick={async () => {
          try {
            const res = await fetch("/api/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mode: "logout" }),
            });
            if (!res.ok) throw new Error();
            router.push("/login");
            router.refresh();
          } catch {
            setError("退出失败，请重试");
          }
        }}
      >
        退出登录
      </button>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
