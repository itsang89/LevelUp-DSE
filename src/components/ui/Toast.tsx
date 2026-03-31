import { createPortal } from "react-dom";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

function variantAccentClass(variant: ToastVariant): string {
  switch (variant) {
    case "success":
      return "bg-success";
    case "error":
      return "bg-dot-red";
    case "info":
    default:
      return "bg-primary";
  }
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[60] flex w-[min(90vw,24rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="relative overflow-hidden rounded-[1.5rem] border border-border-hairline bg-surface p-4 pr-12 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300"
          role="status"
          aria-live="polite"
        >
          <div className={`absolute inset-y-0 left-0 w-1.5 ${variantAccentClass(toast.variant)}`} />
          <p className="text-xs font-semibold text-primary pl-2 leading-relaxed">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
            aria-label="Dismiss notification"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
