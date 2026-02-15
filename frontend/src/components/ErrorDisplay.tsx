interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="glass-card border-risk-high/30 p-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-risk-high/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-risk-high" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-risk-high">Analysis Failed</h3>
          <p className="text-sm text-text-secondary mt-1 break-words">{message}</p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="mt-4 w-full py-2.5 px-4 bg-bg-hover hover:bg-bg-hover/80 text-text-primary text-sm
                   font-medium rounded-lg transition-colors border border-border-card"
      >
        Try Again
      </button>
    </div>
  );
}
