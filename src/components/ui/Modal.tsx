import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
}

export function Modal({ isOpen, onClose, title, children, description }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="fixed inset-0 bg-primary/10 backdrop-blur-md transition-opacity duration-500" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-lg flex flex-col overflow-hidden rounded-[2.5rem] bg-surface shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 hairline-border max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors z-10 bg-surface/80 backdrop-blur-sm py-1 px-3 rounded-full border border-border-hairline hover:bg-muted/50"
          title="Cancel"
        >
          Cancel
        </button>
        <div className="p-10 pb-0 shrink-0">
          <h3 className="text-2xl font-light text-primary tracking-tight leading-none mb-3 pr-8">{title}</h3>
          {description && (
            <p className="text-sm font-light text-muted-foreground leading-relaxed pr-4">{description}</p>
          )}
        </div>
        <div className="p-10 pt-8 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>,
    document.body
  );
}
