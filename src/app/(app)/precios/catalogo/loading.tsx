export default function CatalogoLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="px-1 space-y-2">
        <div className="h-7 w-64 rounded bg-white/10 animate-pulse" />
        <div className="h-4 w-96 max-w-full rounded bg-white/5 animate-pulse" />
      </div>
      <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="h-10 rounded-full bg-white/5 animate-pulse" />
        <div className="flex gap-2 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-24 rounded-full bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="p-4 space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
