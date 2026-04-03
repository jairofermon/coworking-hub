import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface FilterBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  children?: React.ReactNode;
}

export function FilterBar({ placeholder = 'Buscar...', value, onChange, children }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9"
        />
      </div>
      {children}
    </div>
  );
}
