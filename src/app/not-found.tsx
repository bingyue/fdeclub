import { PageHero, ButtonLink } from "@/components/ui";
export default function NotFound() {
  return (
    <PageHero
      eyebrow="404 / NOT FOUND"
      title="这条连接，还没有建立。"
      description="页面不存在，或尚未公开。你可以回到首页，寻找新的共创入口。"
    >
      <ButtonLink href="/">返回首页</ButtonLink>
    </PageHero>
  );
}
