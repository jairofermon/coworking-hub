import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FormaPagamento } from '@/types';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; forma: FormaPagamento | null; onConfirm: () => void; }

export function FormaPagamentoDeleteDialog({ open, onOpenChange, forma, onConfirm }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir forma de pagamento</AlertDialogTitle>
          <AlertDialogDescription>Tem certeza que deseja excluir <strong>{forma?.nome}</strong>?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
