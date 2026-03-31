import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const closeConfirm = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setPendingConfirm(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setPendingConfirm(options);
    });
  }, []);

  const contextValue = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}
      <ConfirmDialog
        isOpen={pendingConfirm !== null}
        title={pendingConfirm?.title ?? ""}
        body={pendingConfirm?.body}
        confirmLabel={pendingConfirm?.confirmLabel}
        cancelLabel={pendingConfirm?.cancelLabel}
        destructive={pendingConfirm?.destructive}
        onCancel={() => closeConfirm(false)}
        onConfirm={() => closeConfirm(true)}
      />
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): ConfirmContextValue["confirm"] {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider.");
  }
  return context.confirm;
}
