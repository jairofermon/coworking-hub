import { useState, useMemo, useRef, useEffect } from 'react';
import { Cliente } from '@/types';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  clientes: Cliente[];
  value: string;
  onChange: (clienteId: string) => void;
  error?: string;
  disabled?: boolean;
}

export function ClienteSearchSelect({ clientes, value, onChange, error, disabled }: Props) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = clientes.find(c => c.id === value);

  const filtered = useMemo(() => {
    if (!search) return clientes;
    const q = search.toLowerCase().replace(/[.\-\/]/g, '');
    return clientes.filter(c => {
      const cpfClean = (c.cpf_cnpj || '').replace(/[.\-\/]/g, '').toLowerCase();
      return c.nome_razao_social.toLowerCase().includes(q) || cpfClean.includes(q) || (c.cpf_cnpj || '').toLowerCase().includes(q);
    });
  }, [clientes, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(clienteId: string) {
    onChange(clienteId);
    setSearch('');
    setOpen(false);
  }

  function handleClear() {
    onChange('');
    setSearch('');
  }

  return (
    <div ref={containerRef} className="relative">
      {selected && !open ? (
        <div
          className={cn(
            "flex items-center justify-between h-9 w-full rounded-md border bg-background px-3 py-1 text-sm cursor-pointer",
            error ? 'border-destructive' : 'border-input',
            disabled && 'opacity-50 pointer-events-none'
          )}
          onClick={() => { if (!disabled) setOpen(true); }}
        >
          <span className="truncate">
            {selected.nome_razao_social}
            {selected.cpf_cnpj && <span className="text-muted-foreground ml-2 text-xs">({selected.cpf_cnpj})</span>}
          </span>
          {!disabled && (
            <X className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2 hover:text-foreground" onClick={(e) => { e.stopPropagation(); handleClear(); }} />
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF/CNPJ..."
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className={cn("pl-8", error ? 'border-destructive' : '')}
            disabled={disabled}
          />
        </div>
      )}

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <ScrollArea className="max-h-[200px]">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">Nenhum cliente encontrado</div>
            ) : (
              filtered.map(c => (
                <div
                  key={c.id}
                  className={cn(
                    "flex flex-col px-3 py-2 cursor-pointer hover:bg-accent text-sm",
                    c.id === value && "bg-accent"
                  )}
                  onClick={() => handleSelect(c.id)}
                >
                  <span className="font-medium">{c.nome_razao_social}</span>
                  {c.cpf_cnpj && <span className="text-xs text-muted-foreground">{c.cpf_cnpj}</span>}
                </div>
              ))
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
