import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ToastStack, type ToastItem, type ToastVariant } from "../components/ui/Toast";

interface AddToastInput {
  variant: ToastVariant;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (input: AddToastInput) => void;
}

const DEFAULT_DURATION_MS = 3500;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(({ variant, message, duration = DEFAULT_DURATION_MS }: AddToastInput) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, variant, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const contextValue = useMemo<ToastContextValue>(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return context;
}
