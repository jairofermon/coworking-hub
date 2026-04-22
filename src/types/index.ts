export interface Sala {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  cor_identificacao: string;
  observacao: string;
}

export interface DisponibilidadeSala {
  id: string;
  sala_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
}

export interface Cliente {
  id: string;
  cpf_cnpj: string;
  rg_inscricao_estadual: string;
  nome_razao_social: string;
  especialidade: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  endereco_completo: string;
  chave_pix: string;
  observacao: string;
  status_funil: 'lead' | 'free' | 'pago';
  created_at: string;
  updated_at: string;
}

export interface Plano {
  id: string;
  nome: string;
  descricao: string;
  valor_previsto: number;
  horas_previstas: number;
  ativo: boolean;
}

export interface FormaPagamento {
  id: string;
  nome: string;
  taxa_percentual: number;
  dias_recebimento: number;
  tipo_recebimento: string;
  permite_parcelamento: boolean;
  observacao: string;
  ativo: boolean;
}

export interface Contrato {
  id: string;
  codigo: string;
  cliente_id: string;
  sala_id: string;
  plano_id: string;
  forma_pagamento_id: string;
  valor_total: number;
  desconta_taxa: boolean;
  valor_taxa: number;
  valor_liquido: number;
  data_inicio: string;
  data_fim: string;
  status: 'ativo' | 'encerrado' | 'cancelado';
  observacao: string;
}

export interface Agendamento {
  id: string;
  sala_id: string;
  cliente_id: string;
  contrato_id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  status: 'confirmado' | 'pendente' | 'cancelado';
  observacao: string;
  checkin_at: string;
  checkout_at: string;
}

export interface Fatura {
  id: string;
  cliente_id: string;
  contrato_id: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string;
  status: 'em_revisao' | 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  forma_pagamento: string;
  observacao: string;
  created_at: string;
  updated_at: string;
}
