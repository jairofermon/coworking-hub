import { Sala, Cliente, Plano, FormaPagamento, Contrato, Agendamento, DisponibilidadeSala } from '@/types';

export const mockSalas: Sala[] = [
  { id: '1', nome: 'Sala Orquídea', descricao: 'Sala individual para atendimento', ativo: true, cor_identificacao: '#6366f1', observacao: '' },
  { id: '2', nome: 'Sala Jasmim', descricao: 'Sala dupla com maca', ativo: true, cor_identificacao: '#ec4899', observacao: '' },
  { id: '3', nome: 'Sala Lavanda', descricao: 'Sala para reuniões pequenas', ativo: true, cor_identificacao: '#8b5cf6', observacao: '' },
  { id: '4', nome: 'Sala Girassol', descricao: 'Sala ampla para workshops', ativo: false, cor_identificacao: '#f59e0b', observacao: 'Em manutenção' },
];

export const mockDisponibilidades: DisponibilidadeSala[] = [
  { id: '1', sala_id: '1', dia_semana: 1, hora_inicio: '08:00', hora_fim: '18:00', ativo: true },
  { id: '2', sala_id: '1', dia_semana: 2, hora_inicio: '08:00', hora_fim: '18:00', ativo: true },
  { id: '3', sala_id: '2', dia_semana: 1, hora_inicio: '09:00', hora_fim: '20:00', ativo: true },
];

export const mockClientes: Cliente[] = [
  { id: '1', cpf_cnpj: '123.456.789-00', rg_inscricao_estadual: '12.345.678-9', nome_razao_social: 'Dra. Ana Silva', especialidade: 'Psicologia', data_nascimento: '1985-03-15', telefone: '(11) 99999-1234', email: 'ana@email.com', endereco_completo: 'Rua das Flores, 123', chave_pix: 'ana@email.com', observacao: '', status_funil: 'pago', created_at: '2024-01-10', updated_at: '2024-01-10' },
  { id: '2', cpf_cnpj: '987.654.321-00', rg_inscricao_estadual: '98.765.432-1', nome_razao_social: 'Dr. Carlos Mendes', especialidade: 'Nutrição', data_nascimento: '1990-07-22', telefone: '(11) 98888-5678', email: 'carlos@email.com', endereco_completo: 'Av. Principal, 456', chave_pix: '98765432100', observacao: '', status_funil: 'free', created_at: '2024-02-05', updated_at: '2024-02-05' },
  { id: '3', cpf_cnpj: '456.789.123-00', rg_inscricao_estadual: '', nome_razao_social: 'Marina Costa', especialidade: 'Fisioterapia', data_nascimento: '1988-11-08', telefone: '(11) 97777-9012', email: 'marina@email.com', endereco_completo: 'Rua do Sol, 789', chave_pix: '', observacao: 'Cliente desde 2023', status_funil: 'lead', created_at: '2023-06-15', updated_at: '2024-01-20' },
];

export const mockPlanos: Plano[] = [
  { id: '1', nome: 'Avulso', descricao: 'Uso por hora avulsa', valor_previsto: 80, horas_previstas: 1, ativo: true },
  { id: '2', nome: 'Mensal 20h', descricao: '20 horas mensais', valor_previsto: 1200, horas_previstas: 20, ativo: true },
  { id: '3', nome: 'Mensal 40h', descricao: '40 horas mensais', valor_previsto: 2000, horas_previstas: 40, ativo: true },
  { id: '4', nome: 'Integral', descricao: 'Uso integral do espaço', valor_previsto: 3500, horas_previstas: 0, ativo: false },
];

export const mockFormasPagamento: FormaPagamento[] = [
  { id: '1', nome: 'PIX', taxa_percentual: 0, dias_recebimento: 0, tipo_recebimento: 'Imediato', permite_parcelamento: false, observacao: '', ativo: true },
  { id: '2', nome: 'Cartão de Crédito', taxa_percentual: 3.5, dias_recebimento: 30, tipo_recebimento: 'Parcelado', permite_parcelamento: true, observacao: '', ativo: true },
  { id: '3', nome: 'Boleto', taxa_percentual: 1.5, dias_recebimento: 2, tipo_recebimento: 'Compensação', permite_parcelamento: false, observacao: '', ativo: true },
];

export const mockContratos: Contrato[] = [
  { id: '1', codigo: 'CT-0001', cliente_id: '1', sala_id: '1', plano_id: '2', forma_pagamento_id: '1', valor_total: 1200, desconta_taxa: false, valor_taxa: 0, valor_liquido: 1200, data_inicio: '2024-03-01', data_fim: '2025-02-28', status: 'ativo', observacao: '' },
  { id: '2', codigo: 'CT-0002', cliente_id: '2', sala_id: '2', plano_id: '3', forma_pagamento_id: '2', valor_total: 2000, desconta_taxa: true, valor_taxa: 70, valor_liquido: 1930, data_inicio: '2024-04-01', data_fim: '2025-03-31', status: 'ativo', observacao: '' },
];

export const mockAgendamentos: Agendamento[] = [
  { id: '1', sala_id: '1', cliente_id: '1', contrato_id: '1', data: '2024-04-03', hora_inicio: '09:00', hora_fim: '11:00', status: 'confirmado', observacao: '' },
  { id: '2', sala_id: '2', cliente_id: '2', contrato_id: '2', data: '2024-04-03', hora_inicio: '14:00', hora_fim: '16:00', status: 'pendente', observacao: '' },
  { id: '3', sala_id: '1', cliente_id: '3', contrato_id: '1', data: '2024-04-04', hora_inicio: '08:00', hora_fim: '10:00', status: 'confirmado', observacao: '' },
];
