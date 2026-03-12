interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-base">warning</span>
          <p>{message}</p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            aria-label="Dismiss warning"
            className="material-symbols-outlined text-base opacity-70 transition-opacity hover:opacity-100"
            onClick={onDismiss}
          >
            close
          </button>
        ) : null}
      </div>
    </div>
  );
}
