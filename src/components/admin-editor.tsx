"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { editFields, fieldLabels, transitions, type Row } from "@/lib/admin";
import { labels, cityStatuses } from "@/lib/catalog";
type Option = { id: string; name: string };
async function action(body: unknown) {
  const res = await fetch("/api/admin/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "操作失败");
  return data;
}
function localDate(value: unknown) {
  if (!value) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(String(value)))
    .replace(" ", "T");
}
const dateFields = [
  "next_followup_at",
  "starts_at",
  "ends_at",
  "registration_deadline",
  "valid_until",
];
const boolFields = ["requires_approval", "is_public", "leader_consent"];
const areaFields = ["description", "summary", "note", "checkin_info", "value"];
export function AdminEditor({
  kind,
  row,
  cities,
  users,
  role,
  eventTypes,
}: {
  kind: string;
  row: Row;
  cities: Option[];
  users: Option[];
  role: string;
  eventTypes: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const fields = (editFields[kind] || []).filter(
    (f) => !(role === "city_manager" && ["assigned_to", "city_id"].includes(f)),
  );
  function options(f: string): Option[] | null {
    if (f === "city_id") return cities;
    if (f === "assigned_to") return users;
    if (f === "event_type") return eventTypes.map((s) => ({ id: s, name: s }));
    if (f === "role")
      return [
        "super_admin",
        "operations",
        "city_manager",
        "member",
        "enterprise_contact",
      ].map((s) => ({ id: s, name: labels[s] }));
    if (f === "status") {
      const current = String(row.status || "draft");
      let values = [current, ...(transitions[kind]?.[current] || [])];
      if (kind === "profile") values = ["active", "disabled"];
      if (kind === "city_config") values = Object.keys(cityStatuses);
      if (kind === "setting") values = ["public", "private"];
      return [...new Set(values)].map((s) => ({
        id: s,
        name: cityStatuses[s] || labels[s] || s,
      }));
    }
    return null;
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult("");
    try {
      const data = new FormData(e.currentTarget);
      const patch: Record<string, unknown> = {};
      for (const key of fields) {
        const value = String(data.get(key) || "");
        let converted: unknown = value;
        if (boolFields.includes(key)) converted = data.get(key) === "on";
        else if (dateFields.includes(key))
          converted = value
            ? new Date(value + ":00+08:00").toISOString()
            : null;
        else if (
          ["assigned_to", "city_id", "poster_url", "leader_name"].includes(key)
        )
          converted = value || null;
        else if (key === "capacity") converted = Number(value || 20);
        else if (key === "tags")
          converted = value
            .split(/[,，]/)
            .map((s) => s.trim())
            .filter(Boolean);
        else if (key === "value") converted = JSON.parse(value);
        if (!row.id && converted === "") continue;
        if (
          JSON.stringify(converted) !==
          JSON.stringify(row[key] ?? (converted === null ? null : ""))
        )
          patch[key] = converted;
      }
      if (!Object.keys(patch).length) {
        setResult("没有需要保存的修改。");
        return;
      }
      await action({ action: "update", kind, id: row.id || null, patch });
      setResult("已保存，审计记录同步更新。");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="admin-form" onSubmit={submit}>
      <h3>
        {row.id
          ? "更新业务记录"
          : kind === "city_config"
            ? "创建城市招募页"
            : "创建活动草稿"}
      </h3>
      {kind === "event" && (
        <p className="admin-label">
          所有时间按北京时间填写。发布前须确认城市、时间、地点、主办方、参与对象和容量；外链海报应为已授权的HTTPS图片。
        </p>
      )}
      {kind === "membership" && (
        <p className="admin-label">
          本期无收费功能。确认权益时请设置有效期并保留审核依据。
        </p>
      )}
      <div className="form-grid">
        {fields.map((f) => {
          const opts = options(f);
          const label = fieldLabels[f] || f;
          const id = `${row.id || "new"}-${f}`;
          const required = [
            "title",
            "slug",
            "name",
            "region",
            "focus",
            "value",
          ].includes(f);
          if (boolFields.includes(f))
            return (
              <label className="checkbox" key={f}>
                <input
                  type="checkbox"
                  name={f}
                  defaultChecked={Boolean(row[f] ?? f === "requires_approval")}
                />
                <span>{label}</span>
              </label>
            );
          return (
            <div
              className={`field ${areaFields.includes(f) ? "field-wide" : ""}`}
              key={f}
            >
              <label htmlFor={id}>{label}</label>
              {opts ? (
                <select
                  name={f}
                  id={id}
                  defaultValue={String(
                    row[f] ||
                      (f === "event_type"
                        ? eventTypes[0]
                        : f === "status"
                          ? "draft"
                          : ""),
                  )}
                >
                  {["city_id", "assigned_to"].includes(f) && (
                    <option value="">未分配</option>
                  )}
                  {opts.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              ) : areaFields.includes(f) ? (
                <textarea
                  name={f}
                  id={id}
                  rows={f === "value" ? 6 : 3}
                  required={required}
                  maxLength={8000}
                  defaultValue={
                    f === "value"
                      ? JSON.stringify(row[f], null, 2)
                      : String(row[f] || "")
                  }
                />
              ) : (
                <input
                  name={f}
                  id={id}
                  required={required}
                  type={
                    dateFields.includes(f)
                      ? "datetime-local"
                      : f === "capacity"
                        ? "number"
                        : "text"
                  }
                  min={f === "capacity" ? 1 : undefined}
                  max={f === "capacity" ? 10000 : undefined}
                  defaultValue={
                    dateFields.includes(f)
                      ? localDate(row[f])
                      : Array.isArray(row[f])
                        ? (row[f] as string[]).join(", ")
                        : String(row[f] ?? (f === "capacity" ? 20 : ""))
                  }
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="form-bottom">
        <button className="button" disabled={busy}>
          {busy ? "正在保存…" : "保存变更"}
        </button>
      </div>
      {result && (
        <p className="save-result" role="status">
          {result}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
export function LeadNote({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setBusy(true);
        setError("");
        try {
          await action({
            action: "note",
            id,
            note: new FormData(form).get("note"),
          });
          form.reset();
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "保存失败");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="field">
        <label htmlFor={`${id}-note`}>添加跟进记录</label>
        <textarea
          id={`${id}-note`}
          name="note"
          required
          minLength={5}
          maxLength={4000}
          placeholder="记录本次沟通内容和下一步安排。"
          rows={3}
        />
      </div>
      <button className="button" style={{ marginTop: 15 }} disabled={busy}>
        {busy ? "保存中…" : "添加记录"}
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
export function CityGrant({
  applicationId,
  users,
}: {
  applicationId: string;
  users: Option[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const data = new FormData(e.currentTarget);
        try {
          await action({
            action: "grant",
            application_id: applicationId,
            user_id: data.get("user_id"),
            status: data.get("status"),
          });
          setMessage("城市授权已更新。");
          router.refresh();
        } catch (err) {
          setMessage(err instanceof Error ? err.message : "授权失败");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3>城市账号授权（仅超级管理员）</h3>
      <p className="subtle">
        仅可关联审批通过的本城市申请与已设置为城市负责人的账号。
      </p>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`${applicationId}-grant-user`}>城市负责人账号</label>
          <select required name="user_id" id={`${applicationId}-grant-user`}>
            <option value="">选择账号</option>
            {users.map((u) => (
              <option value={u.id} key={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${applicationId}-grant-status`}>授权状态</label>
          <select name="status" id={`${applicationId}-grant-status`}>
            <option value="active">启用</option>
            <option value="paused">暂停</option>
          </select>
        </div>
      </div>
      <button className="button" disabled={busy} style={{ marginTop: 20 }}>
        保存城市授权
      </button>
      {message && (
        <p role="status" className="save-result">
          {message}
        </p>
      )}
    </form>
  );
}
export function RegistrationActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const actions =
    status === "pending"
      ? ["confirmed", "cancelled"]
      : status === "confirmed"
        ? ["attended", "cancelled"]
        : [];
  return (
    <>
      <div className="inline-actions">
        {actions.map((s) => (
          <button
            className="small-button"
            disabled={busy}
            key={s}
            onClick={async () => {
              setBusy(true);
              try {
                await action({ action: "registration", id, status: s });
                router.refresh();
                setMessage("已更新");
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "操作失败");
              } finally {
                setBusy(false);
              }
            }}
          >
            {s === "confirmed"
              ? "审核通过"
              : s === "attended"
                ? "登记签到"
                : "取消报名"}
          </button>
        ))}
      </div>
      {message && (
        <p role="status" className="subtle">
          {message}
        </p>
      )}
    </>
  );
}
