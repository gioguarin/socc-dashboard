import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ message = 'No data available', icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      {icon || <Inbox className="w-10 h-10 mb-3 opacity-40" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}
