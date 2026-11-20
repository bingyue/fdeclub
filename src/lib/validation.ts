import { z } from "zod";
const short = z.string().trim().min(1, "请填写此项").max(160, "最多160字");
const long = z
  .string()
  .trim()
  .min(5, "请至少填写5个字")
  .max(4000, "最多4000字");
export const contact = z
  .string()
  .trim()
  .max(160)
  .refine(
    (v) => /^\+?[\d\s()-]{7,24}$/.test(v) || z.email().safeParse(v).success,
    "请输入有效手机号或邮箱",
  );
const common = {
  contact_name: short,
  contact,
  city_name: short,
  consent: z.literal(true, { error: "请阅读并同意隐私政策" }),
  website: z.string().max(0, "请求未通过校验").optional(),
};
const tracking = {
  source_channel: z.string().trim().max(100).default("website"),
  utm_source: z.string().max(160).optional(),
  utm_medium: z.string().max(160).optional(),
  utm_campaign: z.string().max(160).optional(),
};
export const schemas = {
  enterprise: z.object({
    ...common,
    ...tracking,
    company: short,
    industry: short,
    company_size: short,
    pain_points: long,
    goals: long,
    budget: short,
    timeline: short,
  }),
  city: z.object({
    ...common,
    organization: short,
    identity: short,
    resources: long,
    experience: long,
    vision: long,
  }),
  partner: z.object({
    ...common,
    institution_type: short,
    organization: short,
    direction: short,
    resources: long,
    vision: long,
  }),
  membership: z.object({
    ...common,
    plan_slug: z.enum(["registered", "annual", "industry"]),
    expectation: z.string().trim().max(4000).default(""),
  }),
  expert: z.object({
    ...common,
    domain: short,
    experience: long,
    case_url: z
      .union([z.literal(""), z.url().startsWith("https://")])
      .optional(),
    public_consent: z.boolean().default(false),
  }),
};
export type ApplicationKind = keyof typeof schemas;
const uuid = z.uuid();
const status = z.string().max(30);
const nullableUuid = uuid.nullable();
const text = z.string().trim().max(4000);
const date = z.iso.datetime({ offset: true }).nullable();
export const patchSchemas = {
  enterprise: z
    .object({
      status,
      assigned_to: nullableUuid,
      city_id: nullableUuid,
      next_followup_at: date,
      tags: z.array(z.string().trim().max(40)).max(12),
    })
    .partial()
    .strict(),
  city: z
    .object({
      status,
      assigned_to: nullableUuid,
      city_id: nullableUuid,
      note: text,
    })
    .partial()
    .strict(),
  partner: z
    .object({
      status,
      assigned_to: nullableUuid,
      city_id: nullableUuid,
      note: text,
    })
    .partial()
    .strict(),
  event: z
    .object({
      slug: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .max(100),
      title: short,
      summary: text,
      description: text,
      event_type: short,
      city_id: nullableUuid,
      assigned_to: nullableUuid,
      location: short,
      organizer: short,
      audience: short,
      starts_at: date,
      ends_at: date,
      registration_deadline: date,
      capacity: z.number().int().min(1).max(10000),
      requires_approval: z.boolean(),
      poster_url: z.url().startsWith("https://").nullable(),
      checkin_info: text,
      status,
    })
    .partial()
    .strict(),
  city_config: z
    .object({
      slug: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .max(100),
      name: short,
      region: short,
      description: text,
      focus: short,
      status: z.enum(["recruiting", "preparing", "active", "paused"]),
      is_public: z.boolean(),
      leader_name: short.nullable(),
      leader_consent: z.boolean(),
    })
    .partial()
    .strict(),
  profile: z
    .object({
      role: z.enum([
        "super_admin",
        "operations",
        "city_manager",
        "member",
        "enterprise_contact",
      ]),
      status: z.enum(["active", "disabled"]),
    })
    .partial()
    .strict(),
  expert: z.object({ status }).strict(),
  membership: z.object({ status, valid_until: date }).partial().strict(),
  setting: z
    .object({
      value: z.union([
        z.array(short).max(20),
        z
          .object({
            eyebrow: short,
            description: text,
            show_events: z.boolean(),
          })
          .strict(),
      ]),
      status: z.enum(["public", "private"]),
    })
    .partial()
    .strict(),
};
export const adminAction = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    kind: z.enum([
      "enterprise",
      "city",
      "partner",
      "event",
      "city_config",
      "profile",
      "expert",
      "membership",
      "setting",
    ]),
    id: uuid.nullable(),
    patch: z.record(z.string(), z.unknown()),
  }),
  z.object({ action: z.literal("note"), id: uuid, note: long }),
  z.object({
    action: z.literal("grant"),
    application_id: uuid,
    user_id: uuid,
    status: z.enum(["active", "paused"]),
  }),
  z.object({
    action: z.literal("registration"),
    id: uuid,
    status: z.enum(["confirmed", "cancelled", "attended"]),
  }),
]);
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
