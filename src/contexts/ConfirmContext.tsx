'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";

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
      <Modal
        isOpen={pendingConfirm !== null}
        onClose={() => closeConfirm(false)}
        title={pendingConfirm?.title ?? ""}
        description={pendingConfirm?.body}
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => closeConfirm(false)}>
            {pendingConfirm?.cancelLabel ?? "Cancel"}
          </Button>
          <Button
            variant={pendingConfirm?.destructive ? "danger" : "primary"}
            onClick={() => closeConfirm(true)}
          >
            {pendingConfirm?.confirmLabel ?? "Confirm"}
          </Button>
        </div>
      </Modal>
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