export default function Loading() {
  return (
    <div className="section wrap" role="status" aria-label="正在加载">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-panel" />
      <p className="subtle">正在连接共创网络…</p>
    </div>
  );
}
