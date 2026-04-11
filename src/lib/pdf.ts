import { Contrato, Cliente, Sala, Plano, FormaPagamento, Agendamento } from '@/types';

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
}

function formatCurrency(value: number): string {
  return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function openPdfWindow(html: string, title: string) {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Permita pop-ups para gerar o PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.document.title = title;
  setTimeout(() => win.print(), 500);
}

const baseStyle = `
  <style>
    @media print { body { margin: 0; } }
    body { font-family: Arial, sans-serif; padding: 30px; color: #1a1a1a; font-size: 13px; line-height: 1.5; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 20px; margin: 0 0 4px; color: #2563eb; }
    .header p { margin: 0; color: #666; font-size: 12px; }
    .section { margin-bottom: 16px; }
    .section h2 { font-size: 14px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; }
    table td { padding: 4px 8px; vertical-align: top; }
    table td:first-child { font-weight: 600; color: #555; width: 180px; }
    .financial { background: #f8fafc; border-radius: 6px; padding: 12px; }
    .financial table td { padding: 3px 8px; }
    .financial .total { font-weight: 700; font-size: 14px; border-top: 1px solid #ddd; padding-top: 6px; }
    .obs { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 4px; font-size: 12px; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .badge-ativo { background: #dcfce7; color: #166534; }
    .badge-encerrado { background: #f3f4f6; color: #374151; }
    .badge-cancelado { background: #fee2e2; color: #991b1b; }
    .badge-confirmado { background: #dcfce7; color: #166534; }
    .badge-pendente { background: #fef3c7; color: #92400e; }
  </style>
`;

export function generateContratoPdf(
  contrato: Contrato,
  cliente: Cliente,
  sala: Sala,
  plano: Plano,
  formaPagamento: FormaPagamento
) {
  const statusClass = `badge badge-${contrato.status}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyle}</head><body>
    <div class="header">
      <h1>CM Coworking</h1>
      <p>Contrato de Locação</p>
    </div>
    <div class="section">
      <h2>Dados do Contrato</h2>
      <table>
        <tr><td>Código:</td><td><strong>${contrato.codigo}</strong></td></tr>
        <tr><td>Status:</td><td><span class="${statusClass}">${contrato.status.charAt(0).toUpperCase() + contrato.status.slice(1)}</span></td></tr>
        <tr><td>Período:</td><td>${formatDate(contrato.data_inicio)} a ${formatDate(contrato.data_fim)}</td></tr>
      </table>
    </div>
    <div class="section">
      <h2>Cliente</h2>
      <table>
        <tr><td>Nome/Razão Social:</td><td>${cliente.nome_razao_social}</td></tr>
        <tr><td>CPF/CNPJ:</td><td>${cliente.cpf_cnpj}</td></tr>
        ${cliente.email ? `<tr><td>E-mail:</td><td>${cliente.email}</td></tr>` : ''}
        ${cliente.telefone ? `<tr><td>Telefone:</td><td>${cliente.telefone}</td></tr>` : ''}
        ${cliente.endereco_completo ? `<tr><td>Endereço:</td><td>${cliente.endereco_completo}</td></tr>` : ''}
      </table>
    </div>
    <div class="section">
      <h2>Sala e Plano</h2>
      <table>
        <tr><td>Sala:</td><td>${sala.nome}</td></tr>
        <tr><td>Plano:</td><td>${plano.nome}${plano.horas_previstas > 0 ? ` (${plano.horas_previstas}h previstas)` : ''}</td></tr>
        <tr><td>Forma de Pagamento:</td><td>${formaPagamento.nome}</td></tr>
      </table>
    </div>
    <div class="section">
      <h2>Valores</h2>
      <div class="financial">
        <table>
          <tr><td>Valor Total:</td><td>${formatCurrency(contrato.valor_total)}</td></tr>
          ${contrato.desconta_taxa ? `
            <tr><td>Taxa (${formaPagamento.taxa_percentual}%):</td><td>- ${formatCurrency(contrato.valor_taxa)}</td></tr>
          ` : ''}
          <tr class="total"><td>Valor Líquido:</td><td>${formatCurrency(contrato.valor_liquido)}</td></tr>
        </table>
      </div>
    </div>
    ${contrato.observacao ? `<div class="section"><h2>Observação</h2><div class="obs">${contrato.observacao}</div></div>` : ''}
    <div class="footer">
      Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} — CM Coworking
    </div>
  </body></html>`;

  openPdfWindow(html, `Contrato ${contrato.codigo}`);
}

export function generateAgendamentoPdf(
  agendamento: Agendamento,
  cliente: Cliente,
  sala: Sala,
  contrato?: Contrato | null,
  plano?: Plano | null
) {
  const statusClass = `badge badge-${agendamento.status}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyle}</head><body>
    <div class="header">
      <h1>CM Coworking</h1>
      <p>Comprovante de Agendamento</p>
    </div>
    <div class="section">
      <h2>Dados do Agendamento</h2>
      <table>
        <tr><td>Data:</td><td><strong>${formatDate(agendamento.data)}</strong></td></tr>
        <tr><td>Horário:</td><td><strong>${agendamento.hora_inicio} — ${agendamento.hora_fim}</strong></td></tr>
        <tr><td>Status:</td><td><span class="${statusClass}">${agendamento.status.charAt(0).toUpperCase() + agendamento.status.slice(1)}</span></td></tr>
      </table>
    </div>
    <div class="section">
      <h2>Cliente</h2>
      <table>
        <tr><td>Nome/Razão Social:</td><td>${cliente.nome_razao_social}</td></tr>
        <tr><td>CPF/CNPJ:</td><td>${cliente.cpf_cnpj}</td></tr>
        ${cliente.email ? `<tr><td>E-mail:</td><td>${cliente.email}</td></tr>` : ''}
        ${cliente.telefone ? `<tr><td>Telefone:</td><td>${cliente.telefone}</td></tr>` : ''}
      </table>
    </div>
    <div class="section">
      <h2>Sala</h2>
      <table>
        <tr><td>Sala:</td><td>${sala.nome}</td></tr>
        ${sala.descricao ? `<tr><td>Descrição:</td><td>${sala.descricao}</td></tr>` : ''}
      </table>
    </div>
    ${contrato ? `
    <div class="section">
      <h2>Contrato</h2>
      <table>
        <tr><td>Código:</td><td>${contrato.codigo}</td></tr>
        <tr><td>Período:</td><td>${formatDate(contrato.data_inicio)} a ${formatDate(contrato.data_fim)}</td></tr>
        ${plano ? `<tr><td>Plano:</td><td>${plano.nome}${plano.horas_previstas > 0 ? ` (${plano.horas_previstas}h)` : ''}</td></tr>` : ''}
      </table>
    </div>
    ` : ''}
    ${agendamento.observacao ? `<div class="section"><h2>Observação</h2><div class="obs">${agendamento.observacao}</div></div>` : ''}
    <div class="footer">
      Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} — CM Coworking
    </div>
  </body></html>`;

  openPdfWindow(html, `Agendamento ${formatDate(agendamento.data)} ${agendamento.hora_inicio}`);
}
