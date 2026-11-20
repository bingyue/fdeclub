# Server-Shanghai 部署与运维

目标：腾讯云上海 `Server-Shanghai`（1.116.47.196），域名 `fdeclub.net`。

本目录包含部署方案与实际上线记录。已有 FDEOpen 应用及其 PostgreSQL、Nginx 配置均独立保留。

## 服务结构

- Nginx：域名与 HTTPS，代理到 `127.0.0.1:3216`。
- Next.js standalone：独立 `fdeclub` 系统用户，由 systemd 管理。
- Docker Compose 项目 `fdeclub`：PostgreSQL 17、Supabase Auth、PostgREST；数据库不映射公网端口。
- 私有网关 `127.0.0.1:8016`，Auth/REST 分别仅绑定 `127.0.0.1:8018/8017`。浏览器通过网站服务端操作，不直接访问网关。
- `/opt/fdeclub/releases/<release>`：每次部署的独立源代码及构建。
- `/opt/fdeclub/current`：当前版本软链接。
- `/opt/fdeclub/shared`：生产配置、容器编排与维护脚本，禁止提交到 Git。
- `/opt/fdeclub/backups`：每日 PostgreSQL 自定义格式备份，保留 7 天。此为同机恢复副本，后续应配置加密的异机备份。

使用官方 Supabase Auth/PostgREST 镜像；在国内服务器无法直接拉取时，可在联网机器 `docker pull --platform linux/amd64` 后 `docker save --platform linux/amd64`，经加密传输导入。不可使用来源不明的镜像。

## 首次部署

1. 将源码上传到新的 release 目录，排除 `.git`、`.env*`、`.local-admin.json`、`.deploy`、`node_modules`、`.next`。
2. 确认已安装 Node.js >=22、Docker Compose、Nginx、Certbot，端口 3216、8016-8018 未被占用。
3. 审核 `deploy/generate-env.mjs` 中公开的运营配置。在 release 目录执行 `sudo bash deploy/install.sh`。
4. 脚本生成随机生产密钥、启动独立后端、依次执行 SQL 迁移及种子、`npm ci`、`npm run build`，启动独立 systemd 服务并验证健康状态。迁移有独立 ledger，不重复执行。
5. 为 `@` 和 `www` 添加 A 记录到目标 IP。
6. 使用服务器既有 ACME 账号申请证书；设置 HTTP 跳转 HTTPS、www 跳转主域名，测试 `nginx -t` 后 reload。确保 certbot renew 定时任务及 reload hook 有效。
7. `sudo node deploy/create-admin.mjs` 创建 `fdechina@163.com` 超级管理员，随机密码仅保存于 `/opt/fdeclub/shared/admin-credentials.json`（0600），不发送邮件、不输出日志。通过安全通道交付并妥善保存。

## 运维命令

```sh
systemctl status fdeclub --no-pager
journalctl -u fdeclub -n 80 --no-pager
cd /opt/fdeclub/shared && docker compose ps
curl -fsS https://fdeclub.net/api/health
/opt/fdeclub/shared/backup.sh
```

`/etc/cron.d/fdeclub` 每天备份及清理过期资料，每 5 分钟处理通知队列。当前 `NOTIFICATION_PROVIDER=none`，申请保存在后台，不发送外部消息。SMTP 尚未配置，`EMAIL_AUTH_ENABLED=false`，关闭自助邮箱登录/注册；运营账号使用密码，意向表单不要求账号。

## 更新与回滚

更新时上传到新 release，备份数据库，复用 shared 配置。执行迁移与构建，检查成功后更新 current 并重启。现有 HTTPS 配置不得被首次部署脚本的 HTTP 配置覆盖；后续版本更新应仅执行迁移、构建和服务切换步骤。

无数据库结构变化的更新使用 `sudo bash deploy/update.sh`。脚本核对迁移文件未变化，备份数据库，在独立release中安装和构建，使用仅监听本机的3219端口验证数据库健康及图书页面，再切换current。切换后的健康检查失败会自动恢复上一个release；已有Nginx、证书、数据库容器和共享配置不重建。执行前应从已验证的云控制台核对SSH主机指纹；不能因旧指纹不匹配而关闭主机身份检查。

应用回滚：将 current 指回上一个成功 release，`systemctl restart fdeclub`，检查 `/api/health`。数据库变更须保持向后兼容；如确需恢复数据库，应先停止写入、保留当前备份并经运营确认后使用 `pg_restore`，不能直接覆盖正在运行的业务数据。

## 上线记录

2026-10-25 已部署到上述服务器：

- `https://fdeclub.net` 公网 HTTPS 返回 200；15 个公开/基础路由均通过 HTTP 检查。
- `http://fdeclub.net`、`http://www.fdeclub.net`、`https://www.fdeclub.net` 均以 308 跳转到主域名，保留路径。
- DNSPod `@`、`www` 两条 A 记录均指向 `1.116.47.196`。
- Let's Encrypt ECDSA 证书包含两个域名，有效期至 2027-01-23；已配置 certbot.timer 与 Nginx reload hook，自动续期模拟测试通过。
- 运营主体及邮箱已按用户确认与腾讯云备案主体设置；展示真实备案号 `浙ICP备2025181284号-8`，链接工信部备案网站。
- `npm run check`（含 19 项测试）及服务器 `npm run build` 通过。
- `deploy/smoke.mjs` 在正式 HTTPS 上验证三种 P0 表单入库、后台查询、线索状态、城市审批、跟进备注、CSV 与审计；验证未登录后台接口拒绝、普通会员无法读线索、城市负责人仅能读明确分配的本城线索、跨站提交拒绝。
- 测试账号与申请资料已清理，仅保留操作审计记录。没有发布虚构活动或城市负责人。
- 浏览器可打开主页并导航企业需求页，无浏览器错误日志。
- 首次备份已生成；每日备份及留存清理任务已安装。
- FDEOpen 原有网站与容器保持运行，公网返回 200。

管理员邮箱：`fdechina@163.com`。密码通过本地私有文件 `.deploy/production-admin.json` 交付（0600、已被 Git 忽略），不得写入文档或提交代码。

访问日志不记录访客 IP 和 URL 查询参数，维护日志按周轮转。部署临时 SSH 公钥已于完成时移除，原有授权不变。
