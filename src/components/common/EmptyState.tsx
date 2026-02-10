import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ message = 'No data available', icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <div className="w-16 h-16 rounded-2xl bg-socc-surface/60 border border-socc-border/30 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-7 h-7 opacity-40" />}
      </div>
      <p className="text-sm font-medium text-gray-400">{message}</p>
    </div>
  );
}
