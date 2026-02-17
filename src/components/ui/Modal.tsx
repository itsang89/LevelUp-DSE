import { ReactNode, useEffect } from "react";
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
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 hairline-border">
        <div className="p-10 pb-0">
          <h3 className="text-2xl font-light text-foreground tracking-tight leading-none mb-3">{title}</h3>
          {description && (
            <p className="text-sm font-light text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
        <div className="p-10 pt-8">{children}</div>
      </div>
    </div>,
    document.body
  );
}
