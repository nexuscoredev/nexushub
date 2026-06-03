import { FormEvent, useState } from 'react';
import { supabase, supabaseErrorMessage } from '../lib/supabase';

export type FinanceTable =
  | 'hub_finance_receivables'
  | 'hub_finance_subscriptions'
  | 'hub_finance_investments';

export interface FinanceField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'select';
  defaultValue?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export function getFinanceFields(table: FinanceTable): FinanceField[] {
  if (table === 'hub_finance_receivables') {
    return [
      { name: 'cliente_descricao', label: 'Cliente', type: 'text' },
      { name: 'valor', label: 'Valor', type: 'number' },
      { name: 'data_prevista', label: 'Data', type: 'date' },
      {
        name: 'categoria',
        label: 'Tipo de entrada',
        type: 'select',
        options: [
          { value: 'implantacao', label: 'Implantação' },
          { value: 'mensalidade', label: 'Mensalidade' },
        ],
        defaultValue: 'implantacao',
      },
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
    {
      name: 'categoria',
      label: 'Tipo de saída',
      type: 'select',
      options: [
        { value: 'assinatura', label: 'Assinatura' },
        { value: 'transporte', label: 'Transporte' },
        { value: 'outras', label: 'Outras despesas' },
      ],
      defaultValue: 'outras',
    },
    { name: 'responsavel', label: 'Responsável', type: 'text', defaultValue: 'Rafael' },
    { name: 'status', label: 'Status', type: 'text', defaultValue: 'pago' },
    { name: 'data_investimento', label: 'Data', type: 'date', required: false },
    { name: 'notas', label: 'Notas', type: 'text', required: false },
  ];
}

function buildPayload(fd: FormData, table: FinanceTable): Record<string, unknown> {
  const allowed = new Set(getFinanceFields(table).map((f) => f.name));
  const payload: Record<string, unknown> = {};
  fd.forEach((v, k) => {
    if (!allowed.has(k)) return;
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
  return sanitizePayload(table, payload, {
    defaultAtivoFalse: table === 'hub_finance_subscriptions' && !fd.has('ativo'),
  });
}

/** Garante que só colunas da tabela atual vão ao Supabase (evita ex.: ativo em receivables). */
function sanitizePayload(
  table: FinanceTable,
  payload: Record<string, unknown>,
  opts?: { defaultAtivoFalse?: boolean },
): Record<string, unknown> {
  const allowed = new Set(getFinanceFields(table).map((f) => f.name));
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (allowed.has(key)) out[key] = value;
  }
  if (opts?.defaultAtivoFalse) out.ativo = false;
  return out;
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
  preset?: Record<string, unknown>;
  onSaved: () => void;
  onCancel?: () => void;
}

export function FinanceRecordForm({
  table,
  recordId,
  initialValues,
  preset,
  onSaved,
  onCancel,
}: FinanceRecordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(recordId);
  const fields = getFinanceFields(table);
  const mergedInitial = { ...preset, ...initialValues };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    const payload = sanitizePayload(
      table,
      buildPayload(new FormData(e.currentTarget), table),
    );

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
      {fields.map((f) => {
        const presetVal = preset?.[f.name];
        if (presetVal !== undefined && presetVal !== '' && !isEdit) {
          return <input key={f.name} type="hidden" name={f.name} value={String(presetVal)} />;
        }
        return (
          <div key={f.name}>
            {f.type === 'checkbox' ? (
              <label className="label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  id={f.name}
                  name={f.name}
                  type="checkbox"
                  defaultChecked={
                    mergedInitial[f.name] !== undefined
                      ? Boolean(mergedInitial[f.name])
                      : f.name === 'ativo'
                  }
                />
                {f.label}
              </label>
            ) : f.type === 'select' ? (
              <>
                <label className="label" htmlFor={f.name}>
                  {f.label}
                </label>
                <select
                  id={f.name}
                  name={f.name}
                  className="input"
                  defaultValue={
                    fieldDefaultValue(f, mergedInitial) ?? f.defaultValue ?? f.options?.[0]?.value
                  }
                  required={f.required !== false}
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </>
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
                  defaultValue={fieldDefaultValue(f, mergedInitial)}
                  required={f.required !== false && f.name !== 'notas'}
                />
              </>
            )}
          </div>
        );
      })}
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
  preset?: Record<string, unknown>;
}

export function FinanceCrudBar({ table, onSaved, preset }: FinanceCrudBarProps) {
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
            preset={preset}
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
