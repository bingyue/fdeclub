import { AuthForm } from "@/components/auth-form";
import { PageHero } from "@/components/ui";
import { metadata as meta } from "@/lib/seo";
export const metadata = {
  ...meta("账号登录", "登录FDE Club账号，参与活动或管理授权业务。", "/login"),
  robots: { index: false, follow: false },
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <>
      <PageHero
        eyebrow="MEMBER & OPERATIONS ACCESS"
        title="欢迎回到共创网络"
        description="普通会员可参与活动报名；运营工作台仅向已授权账号开放。"
      />
      <section className="section wrap auth-wrap">
        <AuthForm
          callbackError={!!error}
          emailEnabled={process.env.EMAIL_AUTH_ENABLED !== "false"}
        />
      </section>
    </>
  );
}
