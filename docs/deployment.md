# 部署说明

## 1. 数据库与Auth

创建部署方自己的Supabase项目，确认数据存储区域、适用的数据处理安排及备份策略。生产站不要连接开发数据库。

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npm run db:push
```

该操作将迁移推送到已关联项目，请先核对项目、备份并在预发布环境演练。生产首次部署后执行 `supabase/seed.sql`，其中只有明确的招募城市、会员意向计划和内容配置，无虚构活动或客户记录。后续禁止用 `db:reset` 操作生产数据库。

在Supabase Auth中创建首个管理员（使用真实受控邮箱并完成确认），再在SQL Editor中核对用户ID后执行一次：

```sql
update public.profiles set role = 'super_admin'
where id = 'VERIFIED_AUTH_USER_UUID';
```

之后通过后台管理角色。普通新账号默认member，客户端传入的metadata不会改变角色。推荐为管理员启用Auth提供的多因素验证，并在生产运营制度中要求使用。

Auth Site URL设置为 `https://fdeclub.net`，重定向白名单仅添加实际部署域名的 `/auth/callback`。配置可信SMTP、邮件模板与发送额度。删除不使用的预览/本地重定向URL。

## 2. 环境变量

见 `.env.example`。`NEXT_PUBLIC_` 只有站点URL、Supabase项目URL和publishable/anon公钥；`SUPABASE_SERVICE_ROLE_KEY`、`DATA_HASH_SECRET`、`CRON_SECRET`、邮件与飞书凭据绝不能进入客户端。

- `NEXT_PUBLIC_SITE_URL=https://fdeclub.net`（禁止尾部带路径）。
- `DATA_HASH_SECRET` / `CRON_SECRET`：各生成独立32字节随机值，至少32字符。
- `CLIENT_IP_MODE=vercel`：仅用于Vercel，由可信平台头获取来源。
- 自有代理使用 `trusted-proxy`，代理必须覆盖 `x-real-ip`，不可透传客户端伪造值。默认 `shared` 使用保守的全站桶，适合本地，生产高并发需正确配置可信代理。
- `LAUNCH_APPROVED=false` 默认不开放生产资料收集。实际主体、隐私联系、托管/服务商、备案及政策审核完成后，设置 `OPERATOR_NAME`、`PRIVACY_EMAIL` 并启用 `LAUNCH_APPROVED=true`。`CONTACT_EMAIL` 为公开业务联系，可选。
- `ICP_NUMBER`、`PUBLIC_SECURITY_NUMBER`、`PUBLIC_SECURITY_URL` 只填真实信息。未配置不显示任何假编号；公网安备链接仅允许官方域名。

隐私和条款页面是待运营方审核的基础版本，不应通过仅切换环境变量来代替法律文本、实际服务商与托管地区的补全。

## 3. Vercel

导入本目录为项目根目录，框架选Next.js，Node 22+，安装 `npm ci`，构建 `npm run build`。配置环境变量后部署；绑定 `fdeclub.net` 并按平台要求设置DNS。发布后确认HTTPS、Auth跳转、canonical与sitemap域名正确，并跑预发布验收。当前未执行任何公网发布。

## 4. 自有Node.js

```bash
npm ci
npm run build
npm run start
```

也支持standalone运行：复制 `.next/standalone`、`public` 和 `.next/static` 到部署目录对应位置，执行 `node server.js`。使用进程管理器和反向代理，启用HTTPS并将请求体上限设为32KB。代理应覆盖而不是追加 `X-Real-IP`：

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Real-IP $remote_addr;
  client_max_body_size 32k;
}
```

## 5. 通知与留存任务

通知通道：`none`、`feishu` 或 `resend`。飞书使用受控群机器人webhook（需相应网络访问权限）；Resend配置API密钥、已验证发件人及收件人。通知仅含业务类型、记录ID与后台链接，没有联系方式和正文。队列重试使用原子领取与5分钟租约；Resend有幂等键，飞书在网络确认不明确时可能重复通知，不会重复创建业务申请。

申请落库后尝试发送通知。定时调度请从受控运行环境调用：

```bash
curl -X POST "$SITE_URL/api/internal/maintenance" -H "Authorization: Bearer $CRON_SECRET"
curl -X POST "$SITE_URL/api/internal/maintenance?mode=retention" -H "Authorization: Bearer $CRON_SECRET"
```

建议每5分钟处理通知、每日清理到期数据。密钥保存在调度平台密钥管理中，避免打印到日志。以上只是部署接口说明，仓库不会自动创建外部自动化。

## 6. 发布和回滚

先应用向后兼容迁移，再发布应用；每次发布前跑 `npm run check`、`npm run build` 与浏览器验收。备份并记录迁移版本。代码可回滚至上一部署，数据库变更优先补充前向修复迁移，避免直接删除数据。监控提交5xx、Auth失败、通知失败和数据库容量。业务日志只记录错误类型，禁止记录请求正文、Cookie或密钥；反向代理访问日志仅记录路径（如Nginx的 `$uri`），不记录包含搜索词的查询参数。

依据实际境内部署及业务安排，由部署方完成所需域名备案、接入要求、公安备案（如适用）和数据处理手续。本项目没有编造或代办编号。
