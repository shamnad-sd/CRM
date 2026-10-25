"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { DealSummary } from "@/lib/deals-data";
import type { AppUserRole } from "@/types/next-auth";
import { DEAL_STAGE_LABELS } from "@/lib/constants";
import { updateDeal, deleteDeal } from "@/actions/deals";
import { formatCurrency } from "@/lib/format";
import { DealForm } from "@/components/deals/deal-form";
import type { ContactOption } from "@/components/deals/contact-picker";
import type { DealPickerOption } from "@/components/tasks/deal-picker";
import type { UserOption } from "@/lib/users-data";
import { ActivityTimeline } from "@/components/activities/activity-timeline";
import { QuickAddTaskButton } from "@/components/tasks/quick-add-task-button";
import { Button } from "@/components/ui/button";
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DealDetailPanelProps {
  deal: DealSummary;
  contacts: ContactOption[];
  dealOptions: DealPickerOption[];
  userOptions: UserOption[];
  currentUserId: string;
  role: AppUserRole;
}

export function DealDetailPanel({
  deal,
  contacts,
  dealOptions,
  userOptions,
  currentUserId,
  role,
}: DealDetailPanelProps) {
  const [isDeleting, startDeleteTransition] = useTransition();
  const canManage = role === "admin" || deal.owner?.id === currentUserId;

  const handleDelete = () => {
    startDeleteTransition(() => {
      deleteDeal(deal.id);
    });
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle>{deal.title}</SheetTitle>
        <SheetDescription>
          {DEAL_STAGE_LABELS[deal.stage]} · {formatCurrency(deal.value)}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-6 p-6">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Contact
            </dt>
            <dd className="text-sm text-slate-900">
              {deal.contact ? (
                <Link
                  href={`/dashboard/contacts/${deal.contact.id}`}
                  className="text-slate-900 underline underline-offset-2 hover:text-slate-700"
                >
                  {deal.contact.name}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Owner
            </dt>
            <dd className="text-sm text-slate-900">{deal.owner?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Expected close
            </dt>
            <dd className="text-sm text-slate-900">
              {deal.expectedCloseDate
                ? new Date(deal.expectedCloseDate).toLocaleDateString()
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Created
            </dt>
            <dd className="text-sm text-slate-900">
              {new Date(deal.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Activity</h4>
            {deal.contact && (
              <QuickAddTaskButton
                contacts={contacts}
                deals={dealOptions}
                users={userOptions}
                currentUserId={currentUserId}
                role={role}
                defaultValues={{ contactId: deal.contact.id, dealId: deal.id }}
              />
            )}
          </div>
          {deal.contact ? (
            <ActivityTimeline contactId={deal.contact.id} dealId={deal.id} />
          ) : (
            <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
              This deal has no linked contact.
            </p>
          )}
        </div>

        {canManage && (
          <>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-900">
                Edit deal
              </h4>
              <DealForm
                action={updateDeal.bind(null, deal.id)}
                contacts={contacts}
                defaultValues={{
                  title: deal.title,
                  contactId: deal.contact?.id,
                  value: deal.value,
                  stage: deal.stage,
                  expectedCloseDate: deal.expectedCloseDate,
                }}
                title="Edit deal"
                submitLabel="Save changes"
                pendingLabel="Saving..."
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete deal</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this deal?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the deal. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={isDeleting} onClick={handleDelete}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </SheetContent>
  );
}
