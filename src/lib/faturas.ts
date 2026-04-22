import { Contrato, Fatura } from '@/types';

export interface ContratoFaturamentoResumo {
  contratoId: string;
  valorContrato: number;
  valorFaturado: number;
  valorPendente: number;
  incompleto: boolean;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function getContratoFaturamentoResumo(
  contrato: Contrato,
  faturas: Fatura[],
  currentFaturaId?: string,
): ContratoFaturamentoResumo {
  const valorFaturado = faturas
    .filter(
      (fatura) =>
        fatura.contrato_id === contrato.id &&
        fatura.status !== 'cancelado' &&
        fatura.id !== currentFaturaId,
    )
    .reduce((sum, fatura) => sum + (Number(fatura.valor) || 0), 0);

  const valorContrato = Number(contrato.valor_total) || 0;
  const valorPendente = Math.max(valorContrato - valorFaturado, 0);

  return {
    contratoId: contrato.id,
    valorContrato,
    valorFaturado,
    valorPendente,
    incompleto: valorPendente > 0,
  };
}

export function buildContratoFaturamentoMap(
  contratos: Contrato[],
  faturas: Fatura[],
): Record<string, ContratoFaturamentoResumo> {
  return contratos.reduce<Record<string, ContratoFaturamentoResumo>>((acc, contrato) => {
    acc[contrato.id] = getContratoFaturamentoResumo(contrato, faturas);
    return acc;
  }, {});
}