"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <section className="section wrap empty-state">
      <h1>内容暂时无法加载</h1>
      <p>请稍后重试。我们不会用示例数据代替未能读取的业务记录。</p>
      <button className="button" onClick={reset}>
        重新加载
      </button>
    </section>
  );
}
