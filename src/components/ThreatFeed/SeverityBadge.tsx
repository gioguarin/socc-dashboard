import { SEVERITY_COLORS } from '../../utils/constants';

interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const colors = SEVERITY_COLORS[severity];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}
    >
      {severity}
    </span>
  );
}
