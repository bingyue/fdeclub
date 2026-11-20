"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import type { ApplicationKind } from "@/lib/validation";
type Field = {
  key: string;
  label: string;
  placeholder?: string;
  options?: string[];
  area?: boolean;
  optional?: boolean;
};
const base: Field[] = [
  { key: "contact_name", label: "联系人", placeholder: "如何称呼您" },
  { key: "contact", label: "手机号或邮箱", placeholder: "用于后续需求沟通" },
  { key: "city_name", label: "所在城市", placeholder: "例如：上海" },
];
const fields: Record<ApplicationKind, Field[]> = {
  enterprise: [
    { key: "company", label: "企业名称", placeholder: "公司或机构全称" },
    {
      key: "industry",
      label: "所属行业",
      options: [
        "制造业",
        "外贸与跨境",
        "电商零售",
        "供应链物流",
        "专业服务",
        "其他",
      ],
    },
    {
      key: "company_size",
      label: "企业规模",
      options: ["50人以下", "50–200人", "200–1000人", "1000人以上", "不便提供"],
    },
    ...base,
    {
      key: "pain_points",
      label: "当前业务痛点",
      area: true,
      placeholder:
        "例如：客服知识分散，人工检索慢，旺季响应时间较长。请不要填写客户个人信息或商业机密。",
    },
    {
      key: "goals",
      label: "希望达成的目标",
      area: true,
      placeholder: "希望改善哪项业务指标？目前的数据、系统和团队条件如何？",
    },
    {
      key: "budget",
      label: "预算区间",
      options: ["暂未明确", "5万元以内", "5–20万元", "20–50万元", "50万元以上"],
    },
    {
      key: "timeline",
      label: "启动周期",
      options: ["1个月内", "1–3个月", "3个月以后", "先沟通了解"],
    },
    {
      key: "source_channel",
      label: "从哪里了解我们",
      options: ["官网访问", "朋友推荐", "产业活动", "FDE品牌生态", "其他"],
    },
  ],
  city: [
    ...base,
    {
      key: "organization",
      label: "所在机构 / 独立身份",
      placeholder: "机构名称，或填写独立共建者",
    },
    {
      key: "identity",
      label: "您的身份",
      options: [
        "企业负责人",
        "产业机构代表",
        "FDE实战专家",
        "社群组织者",
        "独立共建者",
        "其他",
      ],
    },
    {
      key: "resources",
      label: "本地企业和活动资源",
      area: true,
      placeholder: "您连接的行业、企业类型、场地或专业团队。",
    },
    {
      key: "experience",
      label: "过往经验",
      area: true,
      placeholder: "简述相关项目、活动组织或企业服务经历。",
    },
    {
      key: "vision",
      label: "共建设想",
      area: true,
      placeholder: "您希望从什么具体事情开始？",
    },
  ],
  partner: [
    {
      key: "institution_type",
      label: "机构类型",
      options: [
        "产业园区",
        "政府相关机构",
        "高校及研究机构",
        "行业协会",
        "企业服务机构",
        "科技公司",
        "其他",
      ],
    },
    { key: "organization", label: "机构名称", placeholder: "请填写机构全称" },
    ...base,
    {
      key: "direction",
      label: "合作方向",
      options: [
        "企业AI转型服务",
        "人才与能力共建",
        "产业活动联合举办",
        "城市生态共建",
      ],
    },
    {
      key: "resources",
      label: "可协作的资源",
      area: true,
      placeholder: "企业需求、行业资源、场地、人才或技术能力。",
    },
    {
      key: "vision",
      label: "合作目标与意向",
      area: true,
      placeholder: "希望解决什么问题，预期如何共同推进？",
    },
  ],
  membership: [
    ...base,
    {
      key: "plan_slug",
      label: "意向计划",
      options: ["registered", "annual", "industry"],
    },
    {
      key: "expectation",
      label: "期待参与的内容",
      area: true,
      placeholder: "主题交流、城市活动、产业协作……",
      optional: true,
    },
  ],
  expert: [
    ...base,
    {
      key: "domain",
      label: "能力领域",
      options: [
        "业务与行业咨询",
        "Agent与AI应用工程",
        "企业系统集成",
        "交付与解决方案",
        "AI战略与组织",
        "产业培训与活动",
      ],
    },
    {
      key: "experience",
      label: "代表经验与案例说明",
      area: true,
      placeholder:
        "请描述行业、角色、实际承担的工作与可验证成果，避免上传保密资料。",
    },
    {
      key: "case_url",
      label: "公开案例链接",
      placeholder: "https://…（选填，仅支持HTTPS）",
      optional: true,
    },
  ],
};
const names = {
  enterprise: "提交企业AI需求",
  city: "申请城市共建",
  partner: "申请产业合作",
  membership: "登记会员意向",
  expert: "提交专家申请",
};
export function ApplicationForm({
  kind,
  city,
}: {
  kind: ApplicationKind;
  city?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setIssues({});
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const payload: Record<string, unknown> = {
      ...data,
      consent: data.consent === "on",
      public_consent: data.public_consent === "on",
    };
    const query = new URLSearchParams(location.search);
    if (kind === "enterprise")
      for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
        const value = query.get(key);
        if (value) payload[key] = value.slice(0, 160);
      }
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, data: payload }),
      });
      const body = await res.json();
      if (!res.ok) {
        setIssues(body.issues || {});
        throw new Error(body.error || "提交失败，请稍后重试");
      }
      setSuccess(body.id);
      form.reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "网络异常，尚未确认接收，请重试",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="form-card" id="apply">
      <div className="form-heading">
        <span className="eyebrow">LET’S START A CONVERSATION</span>
        <h2>{names[kind]}</h2>
        <p>认真描述你的想法，让下一次沟通更有价值。</p>
      </div>
      {success ? (
        <div className="form-success" role="status">
          <CheckCircle2 size={44} />
          <h3>我们已收到你的资料</h3>
          <p>
            资料已进入审核与跟进队列。提交不代表合作获批，我们将根据实际情况联系你。
          </p>
          <small>受理编号：{success}</small>
          <button
            className="button button-secondary"
            onClick={() => setSuccess("")}
          >
            继续填写其他意向
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate={false}>
          <div className="form-grid">
            {fields[kind].map((f) => (
              <div
                className={`field ${f.area ? "field-wide" : ""}`}
                key={f.key}
              >
                <label htmlFor={`${kind}-${f.key}`}>
                  {f.label}
                  {!f.optional && <span aria-hidden="true"> *</span>}
                </label>
                {f.options ? (
                  <select
                    id={`${kind}-${f.key}`}
                    name={f.key}
                    required={!f.optional}
                    defaultValue=""
                    aria-invalid={!!issues[f.key]}
                    aria-describedby={
                      issues[f.key] ? `${f.key}-error` : undefined
                    }
                  >
                    <option value="" disabled>
                      请选择
                    </option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {(
                          {
                            registered: "注册会员",
                            annual: "年度会员意向",
                            industry: "产业伙伴",
                          } as Record<string, string>
                        )[o] || o}
                      </option>
                    ))}
                  </select>
                ) : f.area ? (
                  <textarea
                    id={`${kind}-${f.key}`}
                    name={f.key}
                    required={!f.optional}
                    minLength={f.optional ? 0 : 5}
                    maxLength={4000}
                    rows={4}
                    placeholder={f.placeholder}
                    aria-invalid={!!issues[f.key]}
                    aria-describedby={
                      issues[f.key] ? `${f.key}-error` : undefined
                    }
                  />
                ) : (
                  <input
                    id={`${kind}-${f.key}`}
                    name={f.key}
                    type={f.key === "case_url" ? "url" : "text"}
                    required={!f.optional}
                    maxLength={160}
                    autoComplete={
                      f.key === "contact_name"
                        ? "name"
                        : f.key === "city_name"
                          ? "address-level2"
                          : f.key === "organization" || f.key === "company"
                            ? "organization"
                            : "off"
                    }
                    defaultValue={f.key === "city_name" ? city : undefined}
                    placeholder={f.placeholder}
                    aria-invalid={!!issues[f.key]}
                    aria-describedby={
                      issues[f.key] ? `${f.key}-error` : undefined
                    }
                  />
                )}{" "}
                {issues[f.key] && (
                  <small className="field-error" id={`${f.key}-error`}>
                    {issues[f.key]}
                  </small>
                )}
              </div>
            ))}
          </div>
          <div className="honeypot" aria-hidden="true">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          {kind === "expert" && (
            <label className="checkbox">
              <input type="checkbox" name="public_consent" />
              <span>
                审核通过后，同意公开展示我的专业简介和授权案例（可选，可撤回）。
              </span>
            </label>
          )}
          <label className="checkbox">
            <input type="checkbox" name="consent" required />
            <span>
              我已阅读并同意
              <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                《隐私政策》
              </Link>
              与
              <Link href="/terms" target="_blank" rel="noopener noreferrer">
                《服务条款》
              </Link>
              ，同意为本次申请与后续沟通处理所填信息。
            </span>
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <div className="form-bottom">
            <button className="button" type="submit" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={17} /> : null}
              {busy ? "正在提交…" : names[kind]}
              {!busy && <ArrowUpRight size={17} />}
            </button>
            <span>
              <LockKeyhole size={14} />
              资料仅用于授权的业务跟进
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
