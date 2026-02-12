import { useState } from 'react';
import { FileText, Download, Printer, RefreshCw } from 'lucide-react';
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
  const { data: briefings, loading, refetch } = useApi<Briefing[]>('/api/briefings', REFRESH_INTERVAL);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch('/api/briefings/generate', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      }
      refetch();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const sorted = briefings
    ? [...briefings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const display = maxItems ? sorted.slice(0, maxItems) : sorted;
  const latestBriefing = sorted[0] ?? null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-socc-border/20 bg-socc-surface/10">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-socc-cyan/10 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-socc-cyan" />
          </div>
          <h3 className="text-sm font-semibold text-gray-200">Briefings</h3>
          {briefings && (
            <Badge className="bg-socc-border/50 text-gray-400">{briefings.length}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Generate new briefing */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold
              bg-socc-cyan/10 text-socc-cyan border border-socc-cyan/20
              hover:bg-socc-cyan/20 hover:border-socc-cyan/40
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200"
            title="Generate new briefing from current data"
          >
            <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Generate'}
          </button>

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
            <button
              onClick={onViewAll}
              className="flex items-center gap-1 text-xs text-socc-cyan/80 hover:text-socc-cyan font-medium transition-colors group/viewall"
            >
              View All
              <span className="group-hover/viewall:translate-x-0.5 transition-transform">&rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Generation error */}
      {genError && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {genError}
        </div>
      )}

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
