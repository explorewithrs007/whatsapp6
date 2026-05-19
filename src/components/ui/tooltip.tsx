import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type TooltipProps = {
  label: string;
  children: ReactNode;
  align?: "center" | "end" | "start";
  side?: "bottom" | "left" | "right" | "top";
  sideOffset?: number;
  className?: string;
};

const tooltipPadding = 8;

export function Tooltip({ align = "center", children, className, label, side = "top", sideOffset = 8 }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;

    if (!trigger || !content) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    let left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
    let top = triggerRect.top - contentRect.height - sideOffset;

    if (align === "start") {
      left = triggerRect.left;
    }

    if (align === "end") {
      left = triggerRect.right - contentRect.width;
    }

    if (side === "bottom") {
      top = triggerRect.bottom + sideOffset;
    }

    if (side === "left") {
      left = triggerRect.left - contentRect.width - sideOffset;
      top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
    }

    if (side === "right") {
      left = triggerRect.right + sideOffset;
      top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
    }

    const maxLeft = window.innerWidth - contentRect.width - tooltipPadding;
    const maxTop = window.innerHeight - contentRect.height - tooltipPadding;

    setPosition({
      left: Math.min(Math.max(left, tooltipPadding), Math.max(maxLeft, tooltipPadding)),
      top: Math.min(Math.max(top, tooltipPadding), Math.max(maxTop, tooltipPadding)),
    });
  }, [align, side, sideOffset]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  return (
    <span
      ref={triggerRef}
      className={cn("inline-flex", className)}
      onBlur={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}
      {isOpen
        ? createPortal(
            <span
              ref={contentRef}
              className="pointer-events-none fixed z-[100] whitespace-nowrap rounded-lg border border-border bg-foreground px-2 py-1 text-xs font-medium text-white shadow-soft"
              style={{ left: position.left, top: position.top }}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
