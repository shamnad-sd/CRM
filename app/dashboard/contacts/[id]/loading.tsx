export default function ContactDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
      <div className="h-48 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
      <div className="h-24 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
      <div className="h-24 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
    </div>
  );
}
