import { motion, AnimatePresence } from 'framer-motion';
import { X, Rss, ExternalLink, Shield, Newspaper } from 'lucide-react';
import type { RssSource } from '../../types';
import { useApi } from '../../hooks/useApi';
import { timeAgo } from '../../utils/formatters';

interface RssSourceManagerProps {
  open: boolean;
  onClose: () => void;
}

const STATUS_STYLES = {
  active: { dot: 'bg-green-500', text: 'text-green-400', label: 'Active' },
  error: { dot: 'bg-red-500', text: 'text-red-400', label: 'Error' },
  pending: { dot: 'bg-gray-500', text: 'text-gray-400', label: 'Pending' },
} as const;

export default function RssSourceManager({ open, onClose }: RssSourceManagerProps) {
  const { data: sources, loading } = useApi<RssSource[]>('/api/sources');

  const threatSources = sources?.filter((s) => s.type === 'threat') || [];
  const newsSources = sources?.filter((s) => s.type === 'news') || [];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-socc-surface border border-socc-border/50 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-socc-border/30">
                <div className="flex items-center gap-2">
                  <Rss className="w-4 h-4 text-socc-cyan" />
                  <h2 className="text-sm font-semibold text-gray-200">RSS Sources</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-socc-hover text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-socc-border/20 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Threat Sources */}
                    <SourceGroup
                      title="Threat Intel"
                      icon={<Shield className="w-3.5 h-3.5 text-red-400" />}
                      sources={threatSources}
                    />

                    {/* News Sources */}
                    <SourceGroup
                      title="News Feeds"
                      icon={<Newspaper className="w-3.5 h-3.5 text-socc-cyan" />}
                      sources={newsSources}
                    />
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-socc-border/20 text-[10px] text-gray-600">
                Sources are managed via pipeline scripts. Add/remove coming soon.
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Grouped source list section */
function SourceGroup({
  title,
  icon,
  sources,
}: {
  title: string;
  icon: React.ReactNode;
  sources: RssSource[];
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
          {title}
        </span>
        <span className="text-[10px] text-gray-600 ml-auto">{sources.length} sources</span>
      </div>
      <div className="space-y-1.5">
        {sources.map((source) => (
          <SourceRow key={source.id} source={source} />
        ))}
      </div>
    </div>
  );
}

/** Individual source row */
function SourceRow({ source }: { source: RssSource }) {
  const statusStyle = STATUS_STYLES[source.status];

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-socc-card/40 border border-socc-border/20 hover:border-socc-border/40 transition-colors">
      <div className={`w-2 h-2 rounded-full shrink-0 ${statusStyle.dot}`} />

      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-200 font-medium truncate">{source.name}</div>
        <div className="text-[10px] text-gray-500 truncate">{source.url}</div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {source.lastFetched && (
          <span className="text-[10px] text-gray-600">
            {timeAgo(source.lastFetched)}
          </span>
        )}
        <span className={`text-[10px] font-medium ${statusStyle.text}`}>
          {statusStyle.label}
        </span>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-400 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
