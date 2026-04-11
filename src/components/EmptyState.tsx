import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  titulo: string;
  descricao?: string;
}

export function EmptyState({ icon: Icon = Inbox, titulo, descricao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{titulo}</p>
      {descricao && <p className="text-sm text-muted-foreground mt-1 max-w-xs">{descricao}</p>}
    </div>
  );
}
