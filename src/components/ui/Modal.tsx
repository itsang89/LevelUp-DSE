import { type ReactNode, useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

export function Modal({ isOpen, onClose, title, children, description }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      previousFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Focus first focusable element on open
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const focusable = getFocusableElements(dialogRef.current);
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, [isOpen]);

  // Escape + focus trap
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = getFocusableElements(dialogRef.current);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-primary/10 backdrop-blur-md transition-opacity duration-500"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-lg flex flex-col overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-surface shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 hairline-border max-h-[90vh]"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 sm:top-8 sm:right-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors z-10 bg-surface/80 backdrop-blur-sm py-1 px-3 rounded-full border border-border-hairline hover:bg-muted/50"
          title="Cancel"
        >
          Cancel
        </button>
        <div className="p-5 sm:p-10 pb-0 sm:pb-0 shrink-0">
          <h3 id={titleId} className="text-2xl font-light text-primary tracking-tight leading-none mb-3 pr-8">{title}</h3>
          {description && (
            <p className="text-sm font-light text-muted-foreground leading-relaxed pr-4">{description}</p>
          )}
        </div>
        <div className="p-5 sm:p-10 pt-6 sm:pt-8 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>,
    document.body
  );
}
