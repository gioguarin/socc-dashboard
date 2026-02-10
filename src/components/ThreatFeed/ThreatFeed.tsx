import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Filter, Download } from 'lucide-react';
import { ThreatItem } from '../../types';
import { useApiWithAnomaly } from '../../hooks/useApiWithAnomaly';
import { REFRESH_INTERVAL } from '../../utils/constants';
import ThreatCard from './ThreatCard';
import ThreatTrends from './ThreatTrends';
import { ThreatSkeleton } from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import Badge from '../common/Badge';
import { AnomalyBanner } from '../common/AnomalyBanner';
import { exportThreatsCsv } from '../../utils/exporters';

interface ThreatFeedProps {
  compact?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
}

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export default function ThreatFeed({ compact = false, maxItems, onViewAll }: ThreatFeedProps) {
  const { data: threats, loading, anomaly } = useApiWithAnomaly<ThreatItem[]>('/api/threats', REFRESH_INTERVAL);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    if (!threats) return [];
    let result = [...threats];
    if (severityFilter !== 'all') result = result.filter((t) => t.severity === severityFilter);
    if (statusFilter !== 'all') result = result.filter((t) => t.status === statusFilter);
    result.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    if (maxItems) result = result.slice(0, maxItems);
    return result;
  }, [threats, severityFilter, statusFilter, maxItems]);

  const newCount = threats?.filter((t) => t.status === 'new').length || 0;
  const kevCount = threats?.filter((t) => t.cisaKev).length || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-socc-border/20 bg-socc-surface/10">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-socc-cyan/10 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-socc-cyan" />
          </div>
          <h3 className="text-sm font-semibold text-gray-200">Threat Intel</h3>
          {newCount > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
              {newCount} new
            </Badge>
          )}
          {kevCount > 0 && (
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {kevCount} KEV
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!compact && filtered.length > 0 && (
            <button
              onClick={() => exportThreatsCsv(filtered)}
              className="p-1.5 rounded transition-colors text-gray-500 hover:text-gray-300"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
          {!compact && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded transition-colors ${showFilters ? 'bg-socc-cyan/10 text-socc-cyan' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
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

      {/* Anomaly alert banner */}
      <AnomalyBanner anomaly={anomaly} />

      {/* Severity Trends — shown in non-compact mode when data available */}
      {!compact && threats && threats.length > 0 && (
        <ThreatTrends threats={threats} />
      )}

      {/* Filters */}
      {!compact && showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 py-2 border-b border-socc-border/20 flex gap-4 overflow-hidden"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Severity</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs bg-socc-surface border border-socc-border/50 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-socc-cyan/50"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-socc-surface border border-socc-border/50 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-socc-cyan/50"
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="investigating">Investigating</option>
              <option value="mitigated">Mitigated</option>
              <option value="not_applicable">N/A</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {loading ? (
          <ThreatSkeleton count={compact ? 3 : 4} />
        ) : filtered.length === 0 ? (
          <EmptyState message="No threats match filters" />
        ) : (
          filtered.map((threat) => <ThreatCard key={threat.id} threat={threat} />)
        )}
      </div>
    </div>
  );
}
