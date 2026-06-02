import { FormEvent, useState } from 'react';
import { supabase, supabaseErrorMessage } from '../lib/supabase';

type FinanceTable =
  | 'hub_finance_receivables'
  | 'hub_finance_subscriptions'
  | 'hub_finance_investments';

interface FinanceCrudBarProps {
  table: FinanceTable;
  onSaved: () => void;
}

export function FinanceCrudBar({ table, onSaved }: FinanceCrudBarProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {};
    fd.forEach((v, k) => {
      if (k === 'valor' || k === 'valor_mensal') payload[k] = Number(v);
      else if (k === 'dia_vencimento') payload[k] = Number(v);
      else if (k === 'ativo') payload[k] = v === 'on';
      else payload[k] = v;
    });

    const { error: err } = await supabase.from(table).insert(payload);
    if (err) setError(supabaseErrorMessage(err));
    else {
      setOpen(false);
      onSaved();
    }
  };

  const fields =
    table === 'hub_finance_receivables'
      ? [
          { name: 'cliente_descricao', label: 'Cliente', type: 'text' },
          { name: 'valor', label: 'Valor', type: 'number' },
          { name: 'data_prevista', label: 'Data', type: 'date' },
          { name: 'status', label: 'Status', type: 'text', defaultValue: 'pendente' },
          { name: 'notas', label: 'Notas', type: 'text' },
        ]
      : table === 'hub_finance_subscriptions'
        ? [
            { name: 'nome', label: 'Nome', type: 'text' },
            { name: 'valor_mensal', label: 'Valor mensal', type: 'number' },
            { name: 'dia_vencimento', label: 'Dia venc.', type: 'number', defaultValue: '5' },
            { name: 'categoria', label: 'Categoria', type: 'text' },
          ]
        : [
            { name: 'titulo', label: 'Descrição', type: 'text' },
            { name: 'valor', label: 'Valor', type: 'number' },
            { name: 'data_investimento', label: 'Data', type: 'date' },
            { name: 'tipo', label: 'Tipo', type: 'text', defaultValue: 'Saída' },
            { name: 'responsavel', label: 'Responsável', type: 'text', defaultValue: 'Rafael' },
            { name: 'status', label: 'Status', type: 'text', defaultValue: 'pago' },
          ];

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button type="button" className="btn-primary" onClick={() => setOpen(!open)}>
        {open ? 'Cancelar' : 'Adicionar registro'}
      </button>
      {open && (
        <form
          className="card"
          style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}
          onSubmit={handleSubmit}
        >
          {fields.map((f) => (
            <div key={f.name}>
              <label className="label" htmlFor={f.name}>
                {f.label}
              </label>
              <input
                id={f.name}
                name={f.name}
                type={f.type}
                className="input"
                defaultValue={'defaultValue' in f ? f.defaultValue : undefined}
                required={f.name !== 'notas' && f.name !== 'categoria'}
              />
            </div>
          ))}
          {error && <div className="error-banner">{error}</div>}
          <button type="submit" className="btn-primary">
            Salvar
          </button>
        </form>
      )}
    </div>
  );
}

export async function deleteFinanceRow(table: FinanceTable, id: string): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado';
  const { error } = await supabase.from(table).delete().eq('id', id);
  return error ? supabaseErrorMessage(error) : null;
}
