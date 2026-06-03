import { FormEvent, useState } from 'react';
import { supabase, supabaseErrorMessage } from '../lib/supabase';

export type FinanceTable =
  | 'hub_finance_receivables'
  | 'hub_finance_subscriptions'
  | 'hub_finance_investments';

export interface FinanceField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'checkbox';
  defaultValue?: string;
  required?: boolean;
}

export function getFinanceFields(table: FinanceTable): FinanceField[] {
  if (table === 'hub_finance_receivables') {
    return [
      { name: 'cliente_descricao', label: 'Cliente', type: 'text' },
      { name: 'valor', label: 'Valor', type: 'number' },
      { name: 'data_prevista', label: 'Data', type: 'date' },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'pendente' },
      { name: 'notas', label: 'Notas', type: 'text', required: false },
    ];
  }
  if (table === 'hub_finance_subscriptions') {
    return [
      { name: 'nome', label: 'Nome', type: 'text' },
      { name: 'valor_mensal', label: 'Valor mensal', type: 'number' },
      { name: 'dia_vencimento', label: 'Dia venc.', type: 'number', defaultValue: '5' },
      { name: 'categoria', label: 'Categoria', type: 'text', required: false },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ];
  }
  return [
    { name: 'titulo', label: 'Descrição', type: 'text' },
    { name: 'valor', label: 'Valor', type: 'number' },
    { name: 'tipo', label: 'Tipo', type: 'text', defaultValue: 'Saída' },
    { name: 'responsavel', label: 'Responsável', type: 'text', defaultValue: 'Rafael' },
    { name: 'status', label: 'Status', type: 'text', defaultValue: 'pago' },
    { name: 'data_investimento', label: 'Data', type: 'date', required: false },
    { name: 'notas', label: 'Notas', type: 'text', required: false },
  ];
}

function buildPayload(fd: FormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  fd.forEach((v, k) => {
    if (k === 'valor' || k === 'valor_mensal' || k === 'dia_vencimento') {
      payload[k] = Number(v);
    } else if (k === 'ativo') {
      payload[k] = v === 'on';
    } else if (k === 'data_investimento' || k === 'notas') {
      const s = String(v).trim();
      if (s) payload[k] = s;
    } else {
      payload[k] = v;
    }
  });
  if (!fd.has('ativo')) payload.ativo = false;
  return payload;
}

function fieldDefaultValue(
  field: FinanceField,
  initial?: Record<string, unknown>,
): string | undefined {
  if (!initial) return 'defaultValue' in field ? field.defaultValue : undefined;
  const val = initial[field.name];
  if (field.type === 'date' && val != null) return String(val).slice(0, 10);
  if (val == null) return undefined;
  return String(val);
}

interface FinanceRecordFormProps {
  table: FinanceTable;
  recordId?: string;
  initialValues?: Record<string, unknown>;
  onSaved: () => void;
  onCancel?: () => void;
}

export function FinanceRecordForm({
  table,
  recordId,
  initialValues,
  onSaved,
  onCancel,
}: FinanceRecordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(recordId);
  const fields = getFinanceFields(table);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    const payload = buildPayload(new FormData(e.currentTarget));

    const { error: err } = isEdit
      ? await supabase.from(table).update(payload).eq('id', recordId!)
      : await supabase.from(table).insert(payload);

    if (err) setError(supabaseErrorMessage(err));
    else onSaved();
  };

  return (
    <form
      className="card"
      style={{ marginBottom: '0.75rem', display: 'grid', gap: '0.75rem' }}
      onSubmit={handleSubmit}
    >
      <h3 style={{ fontSize: '0.9rem', margin: 0 }}>
        {isEdit ? 'Editar registro' : 'Novo registro'}
      </h3>
      {fields.map((f) => (
        <div key={f.name}>
          {f.type === 'checkbox' ? (
            <label className="label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                id={f.name}
                name={f.name}
                type="checkbox"
                defaultChecked={
                  initialValues
                    ? Boolean(initialValues[f.name])
                    : f.name === 'ativo'
                }
              />
              {f.label}
            </label>
          ) : (
            <>
              <label className="label" htmlFor={f.name}>
                {f.label}
              </label>
              <input
                id={f.name}
                name={f.name}
                type={f.type}
                className="input"
                defaultValue={fieldDefaultValue(f, initialValues)}
                required={f.required !== false && f.name !== 'notas' && f.name !== 'categoria'}
              />
            </>
          )}
        </div>
      ))}
      {error && <div className="error-banner">{error}</div>}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="submit" className="btn-primary">
          {isEdit ? 'Salvar alterações' : 'Salvar'}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

interface FinanceCrudBarProps {
  table: FinanceTable;
  onSaved: () => void;
}

export function FinanceCrudBar({ table, onSaved }: FinanceCrudBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button type="button" className="btn-primary" onClick={() => setOpen(!open)}>
        {open ? 'Cancelar' : 'Adicionar registro'}
      </button>
      {open && (
        <div style={{ marginTop: '0.75rem' }}>
          <FinanceRecordForm
            table={table}
            onSaved={() => {
              setOpen(false);
              onSaved();
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

export async function deleteFinanceRow(table: FinanceTable, id: string): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado';
  const { error } = await supabase.from(table).delete().eq('id', id);
  return error ? supabaseErrorMessage(error) : null;
}
