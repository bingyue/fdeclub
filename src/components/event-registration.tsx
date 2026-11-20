"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { labels } from "@/lib/catalog";
export function EventRegistration({
  id,
  loggedIn,
  initialStatus,
  open,
}: {
  id: string;
  loggedIn: boolean;
  initialStatus?: string;
  open: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(action: "register" | "cancel", data?: FormData) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...Object.fromEntries(data || []),
          consent: data?.get("consent") === "on",
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setStatus(body.status);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络异常，请重试。");
    } finally {
      setBusy(false);
    }
  }
  function register(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void submit("register", new FormData(e.currentTarget));
  }
  if (!loggedIn)
    return (
      <Link className="button" href="/login">
        登录后参与报名
      </Link>
    );
  return (
    <div>
      {status && (
        <p className="notice" role="status">
          你的报名状态：{labels[status]}
        </p>
      )}
      {["pending", "confirmed"].includes(status || "") ? (
        <button
          className="button button-secondary"
          disabled={busy}
          onClick={() => submit("cancel")}
        >
          {busy ? "正在处理…" : "取消我的报名"}
        </button>
      ) : open && status !== "attended" ? (
        <form onSubmit={register} className="auth-form">
          <div className="field">
            <label htmlFor="event-name">联系人</label>
            <input
              id="event-name"
              name="contact_name"
              required
              maxLength={80}
            />
          </div>
          <div className="field">
            <label htmlFor="event-contact">手机号或邮箱</label>
            <input id="event-contact" name="contact" required maxLength={160} />
          </div>
          <label className="checkbox">
            <input name="consent" type="checkbox" required />
            <span>
              同意<Link href="/privacy">隐私政策</Link>与
              <Link href="/terms">报名规则</Link>。
            </span>
          </label>
          <button className="button" disabled={busy}>
            {busy ? "正在提交…" : "提交活动报名"}
          </button>
        </form>
      ) : (
        <p className="subtle">当前不接受新的报名。</p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
