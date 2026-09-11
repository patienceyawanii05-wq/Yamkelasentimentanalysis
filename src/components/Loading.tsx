import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return <Loader2 className="animate-spin text-brand-500" style={{ width: size, height: size }} />;
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-light-subtle dark:bg-surface-dark">
      <LoadingSpinner size={40} />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-4 h-8 w-16 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}
