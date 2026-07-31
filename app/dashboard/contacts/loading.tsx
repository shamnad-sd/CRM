export default function ContactsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-32 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="h-10 w-full max-w-sm animate-pulse rounded bg-slate-200" />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse border-b border-slate-100 bg-slate-50 last:border-b-0"
          />
        ))}
      </div>
    </div>
  );
}
