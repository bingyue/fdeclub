# 数据库表清单

- `profiles`
- `organizations`
- `cities`
- `city_applications`
- `city_members`
- `enterprise_leads`
- `lead_activities`
- `partner_applications`
- `events`
- `event_registrations`
- `membership_plans`
- `memberships`
- `expert_profiles`
- `expert_applications`
- `audit_logs`
- `notification_outbox`
- `rate_limits`
- `site_settings`

表之间的外键、检查约束、RLS与写入函数以版本化SQL迁移为准。公开活动通过明确列投影的 `public_events()` 输出；私有签到信息不在投影中。
