import type { AppUserRole } from "@/types/next-auth";

interface TopbarProps {
  name: string;
  role: AppUserRole;
}

export function Topbar({ name, role }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-end border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{name}</p>
          <p className="text-xs capitalize text-slate-500">{role}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          {name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
