"use client";

import { useDraggable } from "@dnd-kit/core";
import type { DealSummary } from "@/lib/deals-data";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface DealCardProps {
  deal: DealSummary;
  onOpen: (dealId: string) => void;
}

export function DealCard({ deal, onOpen }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      data-deal-id={deal.id}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(deal.id)}
      className={cn(
        "cursor-grab touch-none rounded-md border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing",
        isDragging && "opacity-50 z-10"
      )}
    >
      <p className="text-sm font-medium text-slate-900">{deal.title}</p>
      <p className="mt-1 text-xs text-slate-500">{deal.contact?.name ?? "No contact"}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">
          {formatCurrency(deal.value)}
        </span>
        {deal.expectedCloseDate && (
          <span className="text-xs text-slate-500">
            {new Date(deal.expectedCloseDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
