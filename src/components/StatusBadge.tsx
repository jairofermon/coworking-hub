import { Badge } from '@/components/ui/badge';

const statusMap: Record<string, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'bg-success/10 text-success border-success/20' },
  encerrado: { label: 'Encerrado', className: 'bg-muted text-muted-foreground border-border' },
  cancelado: { label: 'Cancelado', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  confirmado: { label: 'Confirmado', className: 'bg-success/10 text-success border-success/20' },
  pendente: { label: 'Pendente', className: 'bg-warning/10 text-warning border-warning/20' },
  true: { label: 'Ativo', className: 'bg-success/10 text-success border-success/20' },
  false: { label: 'Inativo', className: 'bg-muted text-muted-foreground border-border' },
};

export function StatusBadge({ status }: { status: string | boolean }) {
  const key = String(status);
  const config = statusMap[key] || { label: key, className: '' };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
