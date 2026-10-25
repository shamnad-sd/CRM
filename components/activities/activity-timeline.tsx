"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { Phone, Mail, Users as UsersIcon, StickyNote, type LucideIcon } from "lucide-react";
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from "@/lib/constants";
import { fetchActivities, logActivity, type ActivityActionResult } from "@/actions/activities";
import type { ActivitySummary } from "@/lib/activities-data";
import type { ActivityTypeConst } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import { Button } from "@/components/ui/button";

const ACTIVITY_ICONS: Record<ActivityTypeConst, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: UsersIcon,
  note: StickyNote,
};

interface ActivityTimelineProps {
  /** Contact this activity belongs to. Required — every activity is tied to a contact. */
  contactId: string;
  /** When set, the timeline is scoped to this deal only (not the contact's full history). */
  dealId?: string;
}

const initialState: ActivityActionResult | undefined = undefined;

export function ActivityTimeline({ contactId, dealId }: ActivityTimelineProps) {
  const requestKey = `${contactId}:${dealId ?? ""}`;
  // Results are tagged with the key they were fetched for, so loading is
  // derived (key mismatch) instead of being reset synchronously in an effect.
  const [loaded, setLoaded] = useState<{
    key: string;
    activities: ActivitySummary[];
    error: string | null;
  } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (
      prev: ActivityActionResult | undefined,
      formData: FormData
    ): Promise<ActivityActionResult> => {
      const result = await logActivity(contactId, dealId, prev, formData);
      if (result.success && result.activity) {
        const newActivity = result.activity;
        setLoaded((current) =>
          current?.key === requestKey
            ? { ...current, activities: [newActivity, ...current.activities] }
            : current
        );
        formRef.current?.reset();
      }
      return result;
    },
    initialState
  );

  useEffect(() => {
    let active = true;

    fetchActivities(contactId, dealId)
      .then((data) => {
        if (active) setLoaded({ key: requestKey, activities: data, error: null });
      })
      .catch(() => {
        if (active) {
          setLoaded({
            key: requestKey,
            activities: [],
            error: "Could not load activity.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [contactId, dealId, requestKey]);

  const current = loaded?.key === requestKey ? loaded : null;
  const loading = current === null;
  const loadError = current?.error ?? null;
  const activities = current?.activities ?? [];

  return (
    <div className="flex flex-col gap-4">
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-2 rounded-md border border-slate-200 p-3"
      >
        {state?.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <select
          name="type"
          defaultValue="note"
          className="h-9 w-40 rounded-md border border-slate-200 bg-white px-2 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          {ACTIVITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {ACTIVITY_TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        <textarea
          name="content"
          placeholder="Log a call, email, meeting, or note..."
          rows={2}
          required
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-black placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        />
        {state?.fieldErrors?.content && (
          <p className="text-xs text-red-600">{state.fieldErrors.content[0]}</p>
        )}

        <Button type="submit" size="sm" disabled={isPending} className="self-end">
          {isPending ? "Logging..." : "Log activity"}
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Loading activity...</p>
      ) : loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-slate-500">No activity yet</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {activities.map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.type];
            return (
              <li
                key={activity.id}
                className="flex gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <Icon className="h-4 w-4 text-slate-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm text-slate-900">{activity.content}</p>
                  <p className="text-xs text-slate-500">
                    {activity.createdBy?.name ?? "Unknown"} ·{" "}
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
