import { FileText, Download, Printer } from 'lucide-react';
import { Briefing } from '../../types';
import { useApi } from '../../hooks/useApi';
import { REFRESH_INTERVAL } from '../../utils/constants';
import BriefingCard from './BriefingCard';
import { BriefingSkeleton } from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import Badge from '../common/Badge';
import { exportBriefingMarkdown, exportBriefingPdf } from '../../utils/exporters';

interface BriefingPanelProps {
  compact?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
}

export default function BriefingPanel({ compact = false, maxItems, onViewAll }: BriefingPanelProps) {
  const { data: briefings, loading } = useApi<Briefing[]>('/api/briefings', REFRESH_INTERVAL);

  const sorted = briefings
    ? [...briefings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const display = maxItems ? sorted.slice(0, maxItems) : sorted;
  const latestBriefing = sorted[0] ?? null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-socc-border/30">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-socc-cyan" />
          <h3 className="text-sm font-semibold text-gray-200">Briefings</h3>
          {briefings && (
            <Badge className="bg-socc-border/50 text-gray-400">{briefings.length}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Export buttons — shown when there's a latest briefing and not compact */}
          {!compact && latestBriefing && (
            <>
              <button
                onClick={() => exportBriefingMarkdown(latestBriefing)}
                className="p-1.5 rounded transition-colors text-gray-500 hover:text-gray-300"
                title="Export as Markdown"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => exportBriefingPdf(latestBriefing)}
                className="p-1.5 rounded transition-colors text-gray-500 hover:text-gray-300"
                title="Print / Save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {onViewAll && (
            <button onClick={onViewAll} className="text-xs text-socc-cyan hover:text-cyan-300 transition-colors">
              View All →
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {loading ? (
          <BriefingSkeleton count={compact ? 1 : 3} />
        ) : display.length === 0 ? (
          <EmptyState message="No briefings available" />
        ) : (
          display.map((briefing, i) => (
            <BriefingCard
              key={briefing.id}
              briefing={briefing}
              defaultExpanded={compact ? i === 0 : false}
            />
          ))
        )}
      </div>
    </div>
  );
}
