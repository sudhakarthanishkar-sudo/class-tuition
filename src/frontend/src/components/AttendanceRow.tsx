import { StatusPicker } from "@/components/StatusPicker";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  STATUS_CHIP_CLASS,
  STATUS_DOT_CLASS,
  STATUS_LABEL,
} from "@/types/attendance";
import type { AttendanceStatus, AttendanceView } from "@/types/attendance";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";

const REVEAL_WIDTH = 96;
const SWIPE_THRESHOLD = 48;

interface AttendanceRowProps {
  record: AttendanceView;
  index: number;
  onDelete: (id: bigint) => void;
  onChangeStatus: (date: string, status: AttendanceStatus) => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
}

/**
 * One recorded class date. Swipe the card right to reveal a red delete action;
 * tap the card to expand the three status choices and change the recorded status.
 */
export function AttendanceRow({
  record,
  index,
  onDelete,
  onChangeStatus,
  isDeleting = false,
  isUpdating = false,
}: AttendanceRowProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const moved = useRef(false);

  const isRevealed = offset > 0;

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startX.current = event.clientX;
    startOffset.current = offset;
    moved.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    const delta = event.clientX - startX.current;
    if (Math.abs(delta) > 6) moved.current = true;
    const next = Math.min(
      REVEAL_WIDTH,
      Math.max(0, startOffset.current + delta),
    );
    setOffset(next);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setOffset(offset > SWIPE_THRESHOLD ? REVEAL_WIDTH : 0);
  }

  function handleCardClick() {
    if (moved.current) return;
    if (isRevealed) {
      setOffset(0);
      return;
    }
    setIsExpanded((current) => !current);
  }

  return (
    <li
      data-ocid={`attendance.item.${index + 1}`}
      className="relative overflow-hidden rounded-[1.375rem]"
    >
      <div className="swipe-track absolute inset-y-0 left-0 flex w-24 items-center justify-start pl-5">
        <button
          type="button"
          data-ocid={`attendance.delete_button.${index + 1}`}
          aria-label={`Delete attendance for ${formatShortDate(record.date)}`}
          disabled={isDeleting}
          onClick={() => onDelete(record.id)}
          className="grid size-11 place-items-center rounded-full text-destructive-foreground transition-smooth hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive-foreground disabled:opacity-60"
        >
          <Trash2 className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div
        aria-label={`Attendance for ${formatShortDate(record.date)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ transform: `translateX(${offset}px)` }}
        className={cn(
          "relative touch-pan-y select-none rounded-[1.375rem] border border-border bg-card shadow-subtle",
          !isDragging && "transition-transform duration-200 ease-out",
        )}
      >
        <button
          type="button"
          data-ocid={`attendance.row.${index + 1}`}
          aria-expanded={isExpanded}
          onClick={handleCardClick}
          className="flex w-full items-center gap-3 rounded-[1.375rem] px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-2.5 shrink-0 rounded-full",
              STATUS_DOT_CLASS[record.status],
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base font-bold text-foreground">
              {formatShortDate(record.date)}
            </span>
            <span className="block text-xs text-muted-foreground">
              {isExpanded ? "Choose a new status" : "Tap to change status"}
            </span>
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
              STATUS_CHIP_CLASS[record.status],
            )}
          >
            {STATUS_LABEL[record.status]}
          </span>
        </button>

        {isExpanded ? (
          <div className="animate-rise border-t border-border px-4 pb-4 pt-3">
            <StatusPicker
              markerPrefix={`attendance.${index + 1}`}
              value={record.status}
              disabled={isUpdating}
              size="compact"
              onSelect={(status) => {
                if (status === record.status) {
                  setIsExpanded(false);
                  return;
                }
                onChangeStatus(record.date, status);
                setIsExpanded(false);
              }}
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}
