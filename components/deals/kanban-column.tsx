"use client";

import { useDroppable } from "@dnd-kit/core";
import type { DealStage } from "@/lib/constants";
import type { DealSummary } from "@/lib/deals-data";
import { DEAL_STAGE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { DealCard } from "@/components/deals/deal-card";

interface KanbanColumnProps {
  stage: DealStage;
  deals: DealSummary[];
  onOpenDeal: (dealId: string) => void;
}

export function KanbanColumn({ stage, deals, onOpenDeal }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div
      ref={setNodeRef}
      data-stage={stage}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border border-slate-200 bg-slate-50",
        isOver && "border-slate-400 bg-slate-100"
      )}
    >
      <div className="border-b border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            {DEAL_STAGE_LABELS[stage]}
          </h3>
          <span className="text-xs text-slate-500">{deals.length}</span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{formatCurrency(total)}</p>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {deals.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
            No deals
          </p>
        ) : (
          deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onOpen={onOpenDeal} />
          ))
        )}
      </div>
    </div>
  );
}
