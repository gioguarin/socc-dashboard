import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, AlertTriangle, Package, Link } from 'lucide-react';
import { ThreatItem } from '../../types';
import { SEVERITY_COLORS, STATUS_COLORS } from '../../utils/constants';
import { timeAgo, getCvssColor, getCvssBgColor } from '../../utils/formatters';
import { matchVendors, TRACKED_VENDORS } from '../../utils/vendorMapping';
import SeverityBadge from './SeverityBadge';
import Badge from '../common/Badge';

interface ThreatCardProps {
  threat: ThreatItem;
}

export default function ThreatCard({ threat }: ThreatCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sevColors = SEVERITY_COLORS[threat.severity];
  const statusColor = STATUS_COLORS[threat.status];

  /* Compute matched vendors (from server data or client-side matching) */
  const vendors = matchVendors(
    threat.affectedProducts,
    threat.description,
    threat.affectedVendors
  );

  return (
    <motion.div
      layout
      data-item
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative group border border-socc-border/40 rounded-lg overflow-hidden bg-socc-card/60 hover:bg-socc-hover/60 transition-colors duration-200`}
    >
      {/* Severity bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${sevColors.bar}`} />

      <div className="pl-4 pr-3 py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <SeverityBadge severity={threat.severity} />
              {threat.cveId && (
                <span className="text-xs font-mono text-gray-400">{threat.cveId}</span>
              )}
              {threat.cisaKev && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  Actively Exploited
                </span>
              )}
              {/* Vendor badges — visual indicator for tracked companies */}
              {vendors.map((v) => {
                const cfg = TRACKED_VENDORS[v];
                return (
                  <span
                    key={v}
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                    title={`Affects ${cfg.label}`}
                  >
                    {cfg.label}
                  </span>
                );
              })}
            </div>
            <h4 className="text-sm font-medium text-gray-200 leading-snug">{threat.title}</h4>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
              <span>{threat.source}</span>
              <span>•</span>
              <span>{timeAgo(threat.publishedAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {threat.cvssScore != null && (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border text-sm font-mono font-bold ${getCvssColor(threat.cvssScore)} ${getCvssBgColor(threat.cvssScore)}`}
              >
                {threat.cvssScore.toFixed(1)}
              </div>
            )}
            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
              {threat.status.replace('_', ' ')}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-socc-border/30">
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">{threat.description}</p>
              {threat.affectedProducts && threat.affectedProducts.length > 0 && (
                <div className="mt-3 flex items-start gap-2">
                  <Package className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {threat.affectedProducts.map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px]">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Patch URLs from NVD enrichment */}
              {threat.patchUrls && threat.patchUrls.length > 0 && (
                <div className="mt-3 flex items-start gap-2">
                  <Link className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-1">
                    {threat.patchUrls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-green-400 hover:text-green-300 transition-colors truncate max-w-sm"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {threat.url && (
                <a
                  href={threat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-xs text-socc-cyan hover:text-cyan-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View details
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
