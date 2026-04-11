import { supabase } from '@/integrations/supabase/client';
import { Sala, DisponibilidadeSala, Cliente, Plano, FormaPagamento, Contrato, Agendamento, Fatura } from '@/types';

// ── Salas ──

export async function fetchSalas(): Promise<Sala[]> {
  const { data, error } = await supabase.from('salas').select('*').order('nome');
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id, nome: r.nome, descricao: r.descricao ?? '', ativo: r.ativo,
    cor_identificacao: r.cor_identificacao, observacao: r.observacao ?? '',
  }));
}

export async function upsertSala(sala: Omit<Sala, 'id'> & { id?: string }): Promise<Sala> {
  if (sala.id) {
    const { data, error } = await supabase.from('salas').update({
      nome: sala.nome, descricao: sala.descricao, ativo: sala.ativo,
      cor_identificacao: sala.cor_identificacao, observacao: sala.observacao,
    }).eq('id', sala.id).select().single();
    if (error) throw error;
    return { id: data.id, nome: data.nome, descricao: data.descricao ?? '', ativo: data.ativo, cor_identificacao: data.cor_identificacao, observacao: data.observacao ?? '' };
  }
  const { data, error } = await supabase.from('salas').insert({
    nome: sala.nome, descricao: sala.descricao, ativo: sala.ativo,
    cor_identificacao: sala.cor_identificacao, observacao: sala.observacao,
  }).select().single();
  if (error) throw error;
  return { id: data.id, nome: data.nome, descricao: data.descricao ?? '', ativo: data.ativo, cor_identificacao: data.cor_identificacao, observacao: data.observacao ?? '' };
}

export async function deleteSala(id: string) {
  const { error } = await supabase.from('salas').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleSalaAtivo(id: string, ativo: boolean) {
  const { error } = await supabase.from('salas').update({ ativo }).eq('id', id);
  if (error) throw error;
}

// ── Disponibilidade ──

export async function fetchDisponibilidades(salaId?: string): Promise<DisponibilidadeSala[]> {
  let q = supabase.from('disponibilidade_salas').select('*');
  if (salaId) q = q.eq('sala_id', salaId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id, sala_id: r.sala_id, dia_semana: r.dia_semana,
    hora_inicio: r.hora_inicio, hora_fim: r.hora_fim, ativo: r.ativo,
  }));
}

export async function saveDisponibilidades(salaId: string, disps: DisponibilidadeSala[]) {
  const { error: delError } = await supabase.from('disponibilidade_salas').delete().eq('sala_id', salaId);
  if (delError) throw delError;
  if (disps.length === 0) return;
  const { error } = await supabase.from('disponibilidade_salas').insert(
    disps.map(d => ({ sala_id: salaId, dia_semana: d.dia_semana, hora_inicio: d.hora_inicio, hora_fim: d.hora_fim, ativo: d.ativo }))
  );
  if (error) throw error;
}

// ── Clientes ──

export async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase.from('clientes').select('*').order('nome_razao_social');
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id, cpf_cnpj: r.cpf_cnpj ?? '', rg_inscricao_estadual: r.rg_inscricao_estadual ?? '',
    nome_razao_social: r.nome_razao_social, especialidade: r.especialidade ?? '',
    data_nascimento: r.data_nascimento ?? '', telefone: r.telefone ?? '', email: r.email ?? '',
    endereco_completo: r.endereco_completo ?? '', chave_pix: r.chave_pix ?? '',
    observacao: r.observacao ?? '', status_funil: (r as any).status_funil ?? 'lead', created_at: r.created_at, updated_at: r.updated_at,
  }));
}

export async function upsertCliente(c: Omit<Cliente, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Cliente> {
  const payload = {
    cpf_cnpj: c.cpf_cnpj, rg_inscricao_estadual: c.rg_inscricao_estadual,
    nome_razao_social: c.nome_razao_social, especialidade: c.especialidade,
    data_nascimento: c.data_nascimento, telefone: c.telefone, email: c.email,
    endereco_completo: c.endereco_completo, chave_pix: c.chave_pix, observacao: c.observacao,
    status_funil: c.status_funil,
  };
  if (c.id) {
    const { data, error } = await supabase.from('clientes').update(payload).eq('id', c.id).select().single();
    if (error) throw error;
    return mapCliente(data);
  }
  const { data, error } = await supabase.from('clientes').insert(payload).select().single();
  if (error) throw error;
  return mapCliente(data);
}

function mapCliente(r: any): Cliente {
  return {
    id: r.id, cpf_cnpj: r.cpf_cnpj ?? '', rg_inscricao_estadual: r.rg_inscricao_estadual ?? '',
    nome_razao_social: r.nome_razao_social, especialidade: r.especialidade ?? '',
    data_nascimento: r.data_nascimento ?? '', telefone: r.telefone ?? '', email: r.email ?? '',
    endereco_completo: r.endereco_completo ?? '', chave_pix: r.chave_pix ?? '',
    observacao: r.observacao ?? '', status_funil: (r as any).status_funil ?? 'lead', created_at: r.created_at, updated_at: r.updated_at,
  };
}

export async function deleteCliente(id: string) {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw error;
}

// ── Planos ──

export async function fetchPlanos(): Promise<Plano[]> {
  const { data, error } = await supabase.from('planos').select('*').order('nome');
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id, nome: r.nome, descricao: r.descricao ?? '',
    valor_previsto: Number((r as any).valor_previsto ?? 0),
    horas_previstas: Number((r as any).horas_previstas ?? 0),
    ativo: r.ativo,
  }));
}

export async function upsertPlano(p: Omit<Plano, 'id'> & { id?: string }): Promise<Plano> {
  const payload = { nome: p.nome, descricao: p.descricao, horas_previstas: p.horas_previstas, ativo: p.ativo } as any;
  if (p.id) {
    const { data, error } = await supabase.from('planos').update(payload).eq('id', p.id).select().single();
    if (error) throw error;
    return { id: data.id, nome: data.nome, descricao: data.descricao ?? '', valor_previsto: Number((data as any).valor_previsto ?? 0), horas_previstas: Number((data as any).horas_previstas ?? 0), ativo: data.ativo };
  }
  const { data, error } = await supabase.from('planos').insert(payload).select().single();
  if (error) throw error;
  return { id: data.id, nome: data.nome, descricao: data.descricao ?? '', valor_previsto: Number((data as any).valor_previsto ?? 0), horas_previstas: Number((data as any).horas_previstas ?? 0), ativo: data.ativo };
}

export async function deletePlano(id: string) {
  const { error } = await supabase.from('planos').delete().eq('id', id);
  if (error) throw error;
}

// ── Formas de Pagamento ──

export async function fetchFormasPagamento(): Promise<FormaPagamento[]> {
  const { data, error } = await supabase.from('formas_pagamento').select('*').order('nome');
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id, nome: r.nome, taxa_percentual: Number(r.taxa_percentual),
    dias_recebimento: r.dias_recebimento, tipo_recebimento: r.tipo_recebimento ?? '',
    permite_parcelamento: r.permite_parcelamento, observacao: r.observacao ?? '', ativo: r.ativo,
  }));
}

export async function upsertFormaPagamento(f: Omit<FormaPagamento, 'id'> & { id?: string }): Promise<FormaPagamento> {
  const payload = {
    nome: f.nome, taxa_percentual: f.taxa_percentual, dias_recebimento: f.dias_recebimento,
    tipo_recebimento: f.tipo_recebimento, permite_parcelamento: f.permite_parcelamento,
    observacao: f.observacao, ativo: f.ativo,
  };
  if (f.id) {
    const { data, error } = await supabase.from('formas_pagamento').update(payload).eq('id', f.id).select().single();
    if (error) throw error;
    return mapForma(data);
  }
  const { data, error } = await supabase.from('formas_pagamento').insert(payload).select().single();
  if (error) throw error;
  return mapForma(data);
}

function mapForma(r: any): FormaPagamento {
  return {
    id: r.id, nome: r.nome, taxa_percentual: Number(r.taxa_percentual),
    dias_recebimento: r.dias_recebimento, tipo_recebimento: r.tipo_recebimento ?? '',
    permite_parcelamento: r.permite_parcelamento, observacao: r.observacao ?? '', ativo: r.ativo,
  };
}

export async function deleteFormaPagamento(id: string) {
  const { error } = await supabase.from('formas_pagamento').delete().eq('id', id);
  if (error) throw error;
}

// ── Contratos ──

export async function fetchContratos(): Promise<Contrato[]> {
  const { data, error } = await supabase.from('contratos').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id, codigo: (r as any).codigo ?? '', cliente_id: r.cliente_id, sala_id: r.sala_id, plano_id: r.plano_id,
    forma_pagamento_id: r.forma_pagamento_id, valor_total: Number(r.valor_total),
    desconta_taxa: r.desconta_taxa, valor_taxa: Number(r.valor_taxa),
    valor_liquido: Number(r.valor_liquido), data_inicio: r.data_inicio, data_fim: r.data_fim,
    status: r.status as Contrato['status'], observacao: r.observacao ?? '',
  }));
}

export async function upsertContrato(c: Omit<Contrato, 'id' | 'codigo'> & { id?: string }): Promise<Contrato> {
  const payload = {
    cliente_id: c.cliente_id, sala_id: c.sala_id, plano_id: c.plano_id,
    forma_pagamento_id: c.forma_pagamento_id, valor_total: c.valor_total,
    desconta_taxa: c.desconta_taxa, valor_taxa: c.valor_taxa, valor_liquido: c.valor_liquido,
    data_inicio: c.data_inicio, data_fim: c.data_fim, status: c.status, observacao: c.observacao,
  };
  if (c.id) {
    const { data, error } = await supabase.from('contratos').update(payload).eq('id', c.id).select().single();
    if (error) throw error;
    return mapContrato(data);
  }
  const { data, error } = await supabase.from('contratos').insert(payload).select().single();
  if (error) throw error;
  return mapContrato(data);
}

function mapContrato(r: any): Contrato {
  return {
    id: r.id, codigo: r.codigo ?? '', cliente_id: r.cliente_id, sala_id: r.sala_id, plano_id: r.plano_id,
    forma_pagamento_id: r.forma_pagamento_id, valor_total: Number(r.valor_total),
    desconta_taxa: r.desconta_taxa, valor_taxa: Number(r.valor_taxa),
    valor_liquido: Number(r.valor_liquido), data_inicio: r.data_inicio, data_fim: r.data_fim,
    status: r.status as Contrato['status'], observacao: r.observacao ?? '',
  };
}

export async function deleteContrato(id: string) {
  const { error } = await supabase.from('contratos').delete().eq('id', id);
  if (error) throw error;
}

// ── Agendamentos ──

export async function fetchAgendamentos(): Promise<Agendamento[]> {
  const { data, error } = await supabase.from('agendamentos').select('*').order('data').order('hora_inicio');
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id, sala_id: r.sala_id, cliente_id: r.cliente_id,
    contrato_id: r.contrato_id ?? '', data: r.data, hora_inicio: r.hora_inicio,
    hora_fim: r.hora_fim, status: r.status as Agendamento['status'], observacao: r.observacao ?? '',
  }));
}

export async function upsertAgendamento(a: Omit<Agendamento, 'id'> & { id?: string }): Promise<Agendamento> {
  const payload = {
    sala_id: a.sala_id, cliente_id: a.cliente_id,
    contrato_id: a.contrato_id || null, data: a.data,
    hora_inicio: a.hora_inicio, hora_fim: a.hora_fim, status: a.status, observacao: a.observacao,
  };
  if (a.id) {
    const { data, error } = await supabase.from('agendamentos').update(payload).eq('id', a.id).select().single();
    if (error) throw error;
    return mapAgendamento(data);
  }
  const { data, error } = await supabase.from('agendamentos').insert(payload).select().single();
  if (error) throw error;
  return mapAgendamento(data);
}

function mapAgendamento(r: any): Agendamento {
  return {
    id: r.id, sala_id: r.sala_id, cliente_id: r.cliente_id,
    contrato_id: r.contrato_id ?? '', data: r.data, hora_inicio: r.hora_inicio,
    hora_fim: r.hora_fim, status: r.status as Agendamento['status'], observacao: r.observacao ?? '',
  };
}

export async function deleteAgendamento(id: string) {
  const { error } = await supabase.from('agendamentos').delete().eq('id', id);
  if (error) throw error;
}

// ── Faturas ──

export async function fetchFaturas(clienteId?: string): Promise<Fatura[]> {
  let q = supabase.from('faturas').select('*').order('data_vencimento', { ascending: false });
  if (clienteId) q = q.eq('cliente_id', clienteId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id, cliente_id: r.cliente_id, contrato_id: r.contrato_id ?? '',
    valor: Number(r.valor), data_vencimento: r.data_vencimento,
    data_pagamento: r.data_pagamento ?? '', status: r.status as Fatura['status'],
    forma_pagamento: r.forma_pagamento ?? '', observacao: r.observacao ?? '',
    created_at: r.created_at, updated_at: r.updated_at,
  }));
}

export async function upsertFatura(f: Omit<Fatura, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Fatura> {
  const payload = {
    cliente_id: f.cliente_id, contrato_id: f.contrato_id || null,
    valor: f.valor, data_vencimento: f.data_vencimento,
    data_pagamento: f.data_pagamento || null, status: f.status,
    forma_pagamento: f.forma_pagamento, observacao: f.observacao,
  };
  if (f.id) {
    const { data, error } = await supabase.from('faturas').update(payload).eq('id', f.id).select().single();
    if (error) throw error;
    return mapFatura(data);
  }
  const { data, error } = await supabase.from('faturas').insert(payload).select().single();
  if (error) throw error;
  return mapFatura(data);
}

function mapFatura(r: any): Fatura {
  return {
    id: r.id, cliente_id: r.cliente_id, contrato_id: r.contrato_id ?? '',
    valor: Number(r.valor), data_vencimento: r.data_vencimento,
    data_pagamento: r.data_pagamento ?? '', status: r.status as Fatura['status'],
    forma_pagamento: r.forma_pagamento ?? '', observacao: r.observacao ?? '',
    created_at: r.created_at, updated_at: r.updated_at,
  };
}

export async function deleteFatura(id: string) {
  const { error } = await supabase.from('faturas').delete().eq('id', id);
  if (error) throw error;
}

// ── Inativar contratos expirados (client-side fallback) ──
export async function inactivateExpiredContracts() {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase.from('contratos').update({ status: 'encerrado' }).eq('status', 'ativo').lt('data_fim', today);
  if (error) throw error;
}
