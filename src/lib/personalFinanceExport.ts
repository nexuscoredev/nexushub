import type { HubPersonalTransaction } from '../types/database';
import { grupoContaLabel } from './viniciusPersonalFinance';

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function rowToCsvLine(row: HubPersonalTransaction): string {
  return [
    row.tipo === 'entrada' ? 'Receita' : 'Gasto',
    row.descricao,
    String(row.valor).replace('.', ','),
    row.data_referencia?.slice(0, 10) ?? '',
    row.categoria ?? '',
    row.grupo ? grupoContaLabel(row.grupo) : '',
    row.pago ? 'Sim' : 'Não',
    row.dia_vencimento != null ? String(row.dia_vencimento) : '',
    row.notas ?? '',
  ]
    .map((cell) => escapeCsv(cell))
    .join(';');
}

export function downloadPersonalFinanceCsv(
  rows: HubPersonalTransaction[],
  monthKey: string,
): void {
  const headers = [
    'Tipo',
    'Descrição',
    'Valor',
    'Data',
    'Categoria',
    'Grupo',
    'Pago',
    'Vencimento',
    'Notas',
  ];
  const body = rows.map(rowToCsvLine).join('\n');
  const csv = `\uFEFF${headers.join(';')}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nexushub-financas-${monthKey}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
