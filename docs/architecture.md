# FDE Club 实现结构

Next.js App Router + TypeScript；服务端页面读取公开列；CSS/Tailwind 负责响应式；轻量客户端组件负责导航、动效、筛选、表单和管理操作。原型保存在 reference/index.html，仅作为参考。

## 数据关系

profiles 对接 auth.users，角色由 super_admin 管理。organizations 记录机构；cities 是公开城市信息，city_applications 是私有申请，city_members 是城市授权。enterprise_leads 保存私有企业需求，lead_activities 记录跟进，partner_applications 保存机构意向。events 和 event_registrations 管理活动与报名。membership_plans、memberships、expert_profiles、expert_applications 提供后续会员/专家运营基础。audit_logs 记录无敏感正文的变更；notification_outbox 持久化通知；rate_limits 实现跨实例原子限流；site_settings 保存首页配置与活动类型。

## 权限边界

匿名只能读取已公开城市、已发布活动、会员计划、已授权公开专家和公开配置。公开表单只能经服务器验证、限流后由 service_role 写入；浏览器无 service key。后台使用当前用户 JWT + RLS。super_admin / operations 管理业务；city_manager 必须同时具有 active 城市授权且记录明确分配给本人，才能访问线索/机构/活动；城市申请仅总部审核。普通成员不能读取企业线索。无直接客户端写权限，所有工作流写入通过验证角色和状态的数据库函数；审计与业务同事务。角色管理仅 super_admin。

## 交付分期

P0：全部公开页面、三种核心表单、后台登录、线索/城市/机构审批、活动草稿与发布、权限、审计、通知、SEO和部署。

P1 基础：会员/专家意向登记、活动登录报名/取消与授权签到；会员权益激活与专家公开采用后台审核，暂不开放收费。高级分析、精细城市内容编排留待运营需求确定。

P2：51FDE API、OIDC、支付订阅与匹配算法不在本期，不调用不存在的服务。

## 真实状态

种子城市全部为 recruiting；无种子活动、合作机构、专家或用户数。未配置数据库时公开页展示真实的空状态/招募规划，提交返回 503。生产表单需要 LAUNCH_APPROVED 和合法运营主体配置。通知失败不回滚已接收申请，而留在队列重试。提交成功只在数据库事务完成后显示。
