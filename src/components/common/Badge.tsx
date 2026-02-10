interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'solid';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full font-semibold whitespace-nowrap transition-colors';
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
  };
  const variants = {
    default: 'bg-socc-border/50 text-gray-300',
    outline: 'border border-socc-border/50 text-gray-400',
    solid: 'bg-socc-cyan/15 text-socc-cyan border border-socc-cyan/30',
  };

  return (
    <span className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
