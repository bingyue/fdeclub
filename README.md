# FDE Club · FDE前线产业共创俱乐部

让企业AI转型，在每一座城市真实发生。

基于 `reference/index.html` 重构的可部署网站。Next.js 16 App Router / React 19 / TypeScript / Tailwind CSS 4 / Supabase PostgreSQL + Auth / Zod。未使用任何第三方客户数据、虚构活动或合作Logo。

## 快速预览（不需要账号）

```bash
cd /Volumes/ExtSSD/Github/fdeclub
npm install
npm run dev
```

打开 http://localhost:3000 。未配置数据库时，城市为明确的招募规划，活动为空；提交返回真实的503错误，后台显示尚未连接，不会模拟成功。Node.js 22或更高版本。

## 本地完整业务环境

需要 Docker Desktop 已运行。下面命令只针对当前 `supabase/config.toml` 项目。

```bash
npx supabase start
npm run db:reset
node scripts/local-env.mjs
node scripts/create-local-admin.mjs
npm run dev
```

- `db:reset` 会清空**本项目的本地数据库**并执行版本化迁移和种子数据，仅用于初次开发或明确需要重置时。
- `local-env.mjs` 从本地Supabase读取开发密钥并生成随机哈希/维护密钥，写入忽略文件 `.env.local`，拒绝覆盖既有文件。不要提交或分享它。
- 首位本地管理员账号及随机密码保存在忽略文件 `.local-admin.json`，权限为0600。访问 `/login` 使用该文件的账号密码，再进入 `/admin`。
- 只需基础数据库、Auth与REST时，可使用：`npx supabase start -x realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor`。此模式没有本地收信界面，请用已确认邮箱的本地管理员；需要测试邮箱登录时，启用完整服务。
- 正式部署使用 `.env.example` 创建环境配置，**不要使用本地账号、默认数据库密码或开发密钥**。

## 检查与测试

```bash
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm test` 使用 PGlite 运行真实PostgreSQL迁移和RLS，不需要远端账号。覆盖成员隔离、城市范围、提权阻断、三个P0工作流、审计、去重、原子限流、活动容量/取消/签到边界及数据清理。`test:e2e` 启动隔离的3100端口无后端预览，验证375/768/1440响应式、导航、筛选、失败状态和SEO。不会使用 `.env.local` 中的业务数据库。

若本地Supabase和3000端口开发服务已启动，可执行 `npm run test:live`，验证真实HTTP提交、登录、后台审核与活动发布。该脚本只允许localhost数据库，创建并清理带测试前缀的记录和临时账号。

## 已实现

- 全部公开路由：首页、城市中心/详情、企业需求、活动中心/详情、会员计划、机构合作、专家申请、关于、图书与作者、隐私和条款。
- P0 三类表单：Zod校验、同意记录、UTM来源、同日重复请求去重、服务端限流、真实失败/成功反馈。
- 后台：工作台、搜索/状态筛选、线索分配/状态/标签/跟进日期/备注、授权CSV导出、城市审批及授权、机构合作、活动草稿/编辑/发布/取消、基础城市与内容配置、账号角色、审计及通知队列。
- P1基础：会员/专家意向及审核、权益有效期、账号登录、活动报名/取消、名单审核与时间窗口内签到。
- 动效：分段标题入场、Canvas城市球体与指针响应、品牌文字流动、滚动联动的五步合作流程、卡片光晕与立体反馈。提供持久化动效开关，优先遵循 `prefers-reduced-motion`；移动端降低绘制复杂度，画布离屏或页面隐藏时停止绘制。实现说明见 [首页动效](docs/motion-design.md)。
- 配色：FDE 品牌蓝、深海军蓝、白色内容区与 WAIC 蓝紫渐变，全站颜色变量与组件适配集中在 `src/app/theme.css`。
- 图书：主页推荐、`/book`出版资料与作者说明、关于页作者介绍；共用 `src/lib/publication.ts`，来源见 [图书资料](docs/publication.md)。
- SEO：独立元数据、canonical、OG、站点地图、robots、活动结构化数据。
- 无任何收费入口。未实现P2的统一身份、项目中台转交API、会员订阅和匹配算法。

## 项目目录

```text
src/app/                 页面、API、SEO、全局响应式样式
src/components/          页面、表单、活动与后台交互组件
src/lib/                 Supabase、输入校验、通知、权限辅助、目录常量
supabase/migrations/     表、索引、RLS、事务函数、审计、限流和留存清理
supabase/seed.sql         招募城市、意向计划、首页/活动类型配置（无业务样例）
tests/                   PostgreSQL权限测试、输入测试、浏览器验收
scripts/                 本地配置、随机管理员及真实服务验收
reference/index.html     原型，只作参考不直接上线
docs/                    架构、部署、运营与验收说明
```

详细阅读 [架构](docs/architecture.md)、[部署](docs/deployment.md)、[运营](docs/operations.md)、[验收记录](docs/acceptance.md)。

## 上海生产部署

正式站点：[FDEClub.net](https://fdeclub.net)。服务器部署、备份、证书续期和验证记录见 [Server-Shanghai 运维说明](docs/server-shanghai.md)。部署模板位于 `deploy/`；生产密钥不在代码仓库中。
