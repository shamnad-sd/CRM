"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { DEAL_STAGES, type DealStage } from "@/lib/constants";
import type { DealSummary } from "@/lib/deals-data";
import type { AppUserRole } from "@/types/next-auth";
import { updateDealStage } from "@/actions/deals";
import { KanbanColumn } from "@/components/deals/kanban-column";
import { DealDetailPanel } from "@/components/deals/deal-detail-panel";
import { Sheet } from "@/components/ui/sheet";
import type { ContactOption } from "@/components/deals/contact-picker";
import type { DealPickerOption } from "@/components/tasks/deal-picker";
import type { UserOption } from "@/lib/users-data";

interface KanbanBoardProps {
  initialDeals: DealSummary[];
  contacts: ContactOption[];
  dealOptions: DealPickerOption[];
  userOptions: UserOption[];
  currentUserId: string;
  role: AppUserRole;
  initialOpenDealId?: string;
}

export function KanbanBoard({
  initialDeals,
  contacts,
  dealOptions,
  userOptions,
  currentUserId,
  role,
  initialOpenDealId,
}: KanbanBoardProps) {
  const [deals, setDeals] = useState(initialDeals);
  const [prevInitialDeals, setPrevInitialDeals] = useState(initialDeals);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(
    initialOpenDealId ?? null
  );
  const [moveError, setMoveError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Each server redirect (create/update/delete) re-renders this page with a
  // fresh `initialDeals` array; sync local state during render rather than
  // in an Effect, per React's "adjusting state when a prop changes" pattern.
  if (initialDeals !== prevInitialDeals) {
    setPrevInitialDeals(initialDeals);
    setDeals(initialDeals);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const columns = useMemo(
    () =>
      DEAL_STAGES.map((stage) => ({
        stage,
        deals: deals.filter((deal) => deal.stage === stage),
      })),
    [deals]
  );

  const selectedDeal = deals.find((d) => d.id === selectedDealId) ?? null;

  function handleDragEnd(event: DragEndEvent) {
    const dealId = event.active.id as string;
    const newStage = event.over?.id as DealStage | undefined;
    if (!newStage) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    const previousStage = deal.stage;
    setMoveError(null);
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );

    startTransition(async () => {
      const result = await updateDealStage(dealId, newStage);
      if (!result.success) {
        setDeals((prev) =>
          prev.map((d) => (d.id === dealId ? { ...d, stage: previousStage } : d))
        );
        setMoveError(result.error ?? "Could not move the deal.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {moveError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {moveError}
        </p>
      )}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(({ stage, deals: stageDeals }) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              deals={stageDeals}
              onOpenDeal={setSelectedDealId}
            />
          ))}
        </div>
      </DndContext>

      <Sheet
        open={selectedDealId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDealId(null);
        }}
      >
        {selectedDeal && (
          <DealDetailPanel
            deal={selectedDeal}
            contacts={contacts}
            dealOptions={dealOptions}
            userOptions={userOptions}
            currentUserId={currentUserId}
            role={role}
          />
        )}
      </Sheet>
    </div>
  );
}
