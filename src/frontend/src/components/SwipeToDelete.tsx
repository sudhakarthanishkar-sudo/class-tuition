import { Trash2 } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

const REVEAL_WIDTH = 96;
const OPEN_THRESHOLD = 44;

interface SwipeToDeleteProps {
  children: ReactNode;
  onDelete: () => void;
  deleteLabel: string;
  /** Deterministic test marker for the revealed delete button. */
  deleteTestId?: string;
  className?: string;
}

/**
 * Swipe a row to the right to reveal a red delete action.
 * Pointer-driven on touch, with a keyboard-reachable delete button that is
 * always present for assistive tech and desktop users.
 */
export function SwipeToDelete({
  children,
  onDelete,
  deleteLabel,
  deleteTestId,
  className,
}: SwipeToDeleteProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const pointerId = useRef<number | null>(null);

  const close = useCallback(() => setOffset(0), []);

  useEffect(() => {
    if (!dragging) return;
    const previous = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = previous;
    };
  }, [dragging]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerId.current = event.pointerId;
    startX.current = event.clientX;
    startOffset.current = offset;
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || pointerId.current !== event.pointerId) return;
    const delta = event.clientX - startX.current;
    const next = Math.min(
      REVEAL_WIDTH,
      Math.max(0, startOffset.current + delta),
    );
    setOffset(next);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    pointerId.current = null;
    setDragging(false);
    setOffset((current) => (current > OPEN_THRESHOLD ? REVEAL_WIDTH : 0));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setOffset(REVEAL_WIDTH);
    }
    if (event.key === "ArrowLeft" || event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)]",
        className,
      )}
    >
      <div
        aria-hidden={offset === 0}
        className="swipe-track absolute inset-y-0 left-0 flex items-center justify-start pl-5"
        style={{ width: REVEAL_WIDTH }}
      >
        <button
          type="button"
          data-ocid={deleteTestId}
          aria-label={deleteLabel}
          tabIndex={offset > 0 ? 0 : -1}
          onClick={() => {
            close();
            onDelete();
          }}
          className="flex size-11 items-center justify-center rounded-full bg-destructive-foreground/15 text-destructive-foreground transition-smooth hover:bg-destructive-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive-foreground"
        >
          <Trash2 className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative touch-pan-y",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging
            ? "none"
            : "transform 0.28s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
