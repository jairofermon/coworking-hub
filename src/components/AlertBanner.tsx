import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

type AlertType = 'warning' | 'info' | 'success' | 'error';

interface AlertBannerProps {
  type: AlertType;
  children: React.ReactNode;
  className?: string;
}

const configs: Record<AlertType, { icon: typeof AlertTriangle; bg: string }> = {
  warning: { icon: AlertTriangle, bg: 'bg-warning/10 border-warning/30 text-warning' },
  info: { icon: Info, bg: 'bg-primary/10 border-primary/30 text-primary' },
  success: { icon: CheckCircle, bg: 'bg-success/10 border-success/30 text-success' },
  error: { icon: XCircle, bg: 'bg-destructive/10 border-destructive/30 text-destructive' },
};

export function AlertBanner({ type, children, className = '' }: AlertBannerProps) {
  const { icon: Icon, bg } = configs[type];
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${bg} ${className}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
