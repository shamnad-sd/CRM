import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-slate-50 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">
        CRM
      </h1>
      <p className="max-w-md text-slate-600">
        Manage contacts, deals, and tasks in one place.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    </div>
  );
}
