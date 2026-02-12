import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Zap } from 'lucide-react';
import { Briefing } from '../../types';
import { formatDate } from '../../utils/formatters';
import Badge from '../common/Badge';

interface BriefingCardProps {
  briefing: Briefing;
  defaultExpanded?: boolean;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^---$/gm, '<hr class="border-socc-border/30 my-4" />')
    .replace(/^### (.+)$/gm, '<h4 class="text-xs font-semibold text-socc-cyan uppercase tracking-wider mt-4 mb-2">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-sm font-semibold text-gray-200 mt-3 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-200">$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="text-gray-300 not-italic">$1</em>')
    .replace(/^- (.+)$/gm, '<li class="text-xs text-gray-400 ml-3 mb-0.5 list-disc list-inside">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="text-xs text-gray-400 ml-3 mb-0.5 list-decimal list-inside">$1</li>')
    .replace(/\n\n/g, '<br/>')
    .replace(/\n/g, '');
}

export default function BriefingCard({ briefing, defaultExpanded = false }: BriefingCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-socc-border/30 rounded-xl overflow-hidden bg-socc-card/50 hover:shadow-[var(--socc-card-shadow-hover)] transition-all duration-300"
    >
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-socc-hover/30 transition-all duration-200"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-200 font-mono">
            {formatDate(briefing.date)}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
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
            <div className="border-t border-socc-border/20">
              {/* Highlights */}
              {briefing.highlights.length > 0 && (
                <div className="px-4 py-3 bg-socc-surface/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
                      Key Highlights
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {briefing.highlights.map((h, i) => (
                      <Badge key={i} className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                        {h}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div
                className="px-4 py-3 prose-invert max-w-none text-xs text-gray-400 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(briefing.content) }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
