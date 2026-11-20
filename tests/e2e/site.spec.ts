import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
const routes = [
  "/",
  "/cities",
  "/cities/shanghai",
  "/enterprise",
  "/events",
  "/membership",
  "/partners",
  "/experts",
  "/about",
  "/book",
  "/privacy",
  "/terms",
  "/login",
  "/admin",
];
for (const width of [375, 768, 1440])
  test(`公开路由在 ${width}px 无横向溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const res = await page.goto(route);
      expect(res?.status(), route).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      expect(overflow, route).toBe(false);
      await expect(page).toHaveTitle(/.+/);
      if (route === "/book") {
        await page.emulateMedia({ reducedMotion: "reduce" });
        const cover = page.getByRole("img", { name: /封面，邴越著/ });
        await expect(cover).toHaveJSProperty("complete", true);
        expect(
          await cover.evaluate((img: HTMLImageElement) => img.naturalWidth),
        ).toBeGreaterThan(0);
        await page.locator("#author").scrollIntoViewIfNeeded();
        await expect(
          page.getByRole("img", { name: "《FDE前线部署工程师》作者邴越" }),
        ).toHaveJSProperty("complete", true);
        await page.locator(".topline").scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `test-results/book-${width}.png`,
          fullPage: true,
        });
      }
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.locator(".hero-shell").waitFor();
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
  });
test("移动导航可操作并在路由跳转后关闭", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "打开导航" }).click();
  await expect(
    page.getByRole("navigation", { name: "移动导航" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "移动导航" })
    .getByRole("link", { name: "企业需求" })
    .click();
  await expect(page).toHaveURL(/enterprise/);
  await expect(page.getByRole("button", { name: "打开导航" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "移动导航" }),
  ).not.toBeVisible();
});
test("城市和活动筛选呈现真实结果与空状态", async ({ page }) => {
  await page.goto("/cities");
  await page.getByRole("button", { name: "华东", exact: true }).click();
  await expect(page.locator(".city-card")).toHaveCount(2);
  await page.getByLabel("城市状态").selectOption("active");
  await expect(page.locator(".city-card")).toHaveCount(0);
  await expect(page.getByText("这个区域，期待你的加入")).toBeVisible();
  await page.goto("/events");
  await page.getByRole("button", { name: "共创工作坊", exact: true }).click();
  await expect(page.getByText("下一场相遇，正在酝酿")).toBeVisible();
});
test("无后端绝不显示假成功，错误时保留填写内容", async ({ page }) => {
  await page.goto("/enterprise");
  await page.getByLabel("企业名称").fill("验收测试企业");
  await page.getByLabel("所属行业").selectOption("制造业");
  await page.getByLabel("企业规模").selectOption("50人以下");
  await page.getByLabel("联系人", { exact: false }).fill("测试联系人");
  await page.getByLabel("手机号或邮箱").fill("13800000000");
  await page.getByLabel("所在城市").fill("上海");
  await page.getByLabel("当前业务痛点").fill("人工检索时间过长");
  await page.getByLabel("希望达成的目标").fill("希望降低检索耗时");
  await page.getByLabel("预算区间").selectOption("暂未明确");
  await page.getByLabel("启动周期").selectOption("先沟通了解");
  await page.getByLabel("从哪里了解我们").selectOption("官网访问");
  await page.getByRole("checkbox").check();
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/api/applications"),
  );
  await page.getByRole("button", { name: "提交企业AI需求" }).click();
  expect((await response).status()).toBe(503);
  await expect(page.locator(".form-error[role=alert]")).toBeVisible();
  await expect(page.getByText("我们已收到你的资料")).not.toBeVisible();
  await expect(page.getByLabel("企业名称")).toHaveValue("验收测试企业");
});
test("服务端拒绝跨来源请求、无同意与越权导出", async ({ request, baseURL }) => {
  const cross = await request.post("/api/applications", {
    headers: { Origin: "https://evil.example" },
    data: { kind: "city", data: {} },
  });
  expect(cross.status()).toBe(403);
  const invalid = await request.post("/api/applications", {
    headers: { Origin: baseURL! },
    data: { kind: "enterprise", data: { consent: false } },
  });
  expect(invalid.status()).toBe(400);
  expect((await request.get("/api/admin/export")).status()).toBe(401);
});
test("SEO与减少动画偏好有效", async ({ page, request, baseURL }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    baseURL!,
  );
  expect(
    await page
      .locator(".orbit-one")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  const external = await page
    .locator('a[href^="https://"]')
    .evaluateAll((links) =>
      links.every(
        (el) =>
          el.getAttribute("target") === "_blank" &&
          el.getAttribute("rel")?.includes("noopener"),
      ),
    );
  expect(external).toBe(true);
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Disallow: /admin",
  );
});

test("动效可暂停并记住偏好，系统减少动态效果优先", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "暂停动效", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "开启动效", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page
      .locator(".signal-track")
      .evaluate((el) => getComputedStyle(el).animationPlayState),
  ).toBe("paused");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "开启动效", exact: true }),
  ).toBeVisible();
  await expect(page.locator("h1")).toContainText("真实发生");
  await page.getByRole("button", { name: "开启动效", exact: true }).click();
  expect(
    await page
      .locator(".signal-track")
      .evaluate((el) => getComputedStyle(el).animationPlayState),
  ).toBe("running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "已遵循系统减少动态效果设置" }),
  ).toBeDisabled();
  expect(
    await page
      .locator(".signal-track")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});

test("合作流程可直接选择阶段，城市网络链接到真实城市页面", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const stages = page.getByRole("navigation", { name: "合作流程阶段" });
  const target = stages.getByRole("button", { name: /连接专家/ });
  await target.click();
  await expect(target).toHaveAttribute("aria-current", "step");
  await expect(
    page.getByRole("heading", { name: "连接专家", exact: true }),
  ).toBeInViewport();
  await page.locator(".network-node").filter({ hasText: "上海" }).click();
  await expect(page).toHaveURL(/\/cities\/shanghai$/);
  await expect(page.locator("h1")).toContainText("上海");
});

test("公开页面无障碍自动扫描无WCAG A/AA违规", async ({ page }) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of [
    "/",
    "/enterprise",
    "/cities",
    "/membership",
    "/partners",
    "/experts",
    "/events",
    "/about",
    "/book",
    "/login",
    "/privacy",
    "/terms",
  ]) {
    await page.goto(route);
    await page.locator("h1").waitFor();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, route).toEqual([]);
  }
});
