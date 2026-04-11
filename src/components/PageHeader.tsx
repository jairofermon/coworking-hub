import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  titulo: string;
  subtitulo: string;
  acaoPrincipal?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
  children?: React.ReactNode;
}

export function PageHeader({ titulo, subtitulo, acaoPrincipal, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{titulo}</h1>
        <p className="text-sm text-muted-foreground">{subtitulo}</p>
      </div>
      <div className="flex items-center gap-2 mt-3 sm:mt-0">
        {children}
        {acaoPrincipal && (
          <Button onClick={acaoPrincipal.onClick}>
            {acaoPrincipal.icon && <acaoPrincipal.icon className="mr-2 h-4 w-4" />}
            {acaoPrincipal.label}
          </Button>
        )}
      </div>
    </div>
  );
}
