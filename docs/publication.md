# 图书与作者 · 2026-11-20

新增首页图书模块、`/book`图书详情页、`/about#author`作者说明，串联主导航、移动导航和页脚。

## 事实来源

出版信息和作者履历核对自清华大学出版社：https://www.tup.tsinghua.edu.cn/booksCenter/book_11842501.html

- 正式书名：《FDE前线部署工程师：企业AI转型与智能体工程化交付》。
- 作者：邴越；出版社：清华大学出版社。
- ISBN：9787302729556；出版日期：2026-11-01。
- 书籍主题、读者方向及作者经历均作简要整理，页面附出版社来源链接；未添加销量、推荐语、未经确认的职务或会员权益。

书封和作者肖像复用现有项目中对外使用的素材，原样复制，未重新生成或修改：

- `/Users/admin/Documents/Github/51fde/public/books/fde-frontline-cover.png`
- `/Users/admin/Documents/Github/51fde/public/about/bingyue-portrait.png`

网页运行只读取本项目 `public/books/` 下的文件。图片通过 Next Image 提供自适应尺寸与延迟加载，图书详情首屏书封提前加载。

## 维护

- `src/lib/publication.ts`：共享出版信息、作者简介、阅读方向。
- `src/components/publication.tsx`：图书展示与作者说明组件。
- `src/components/publication.module.css`：蓝白与蓝紫渐变样式；书封轻微悬停反馈遵循动效开关和系统减少动态效果偏好。
- `src/app/book/page.tsx`：详情、SEO与Book/Person结构化数据，无报价或交易结构化数据。

本次为本地更新。出版社资料链接跳转至第三方，读书会与分享合作使用现有机构申请入口。

## 验证结果

`npm run check`（19项单元测试）、生产构建、11项浏览器测试通过；新增图书路由纳入375/768/1440px响应式与WCAG自动检查，书封及作者照片加载通过。页面提供Book与Person结构化数据，首页、图书页、关于页及站点地图已在本地3110端口核对。2026-11-20发布准备中已将Next.js及eslint-config-next升级至16.4.6，生产依赖审计为0项漏洞。
