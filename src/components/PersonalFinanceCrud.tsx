import { FormEvent, useState } from 'react';
import { PESSOAL_CATEGORIAS } from '../lib/pessoal';
import { supabase, supabaseErrorMessage } from '../lib/supabase';
import type { HubPersonalTipo } from '../types/database';

const PAYLOAD_KEYS = ['tipo', 'descricao', 'valor', 'data_referencia', 'categoria', 'notas'] as const;

function buildPayload(fd: FormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of PAYLOAD_KEYS) {
    const raw = fd.get(key);
    if (raw == null) continue;
    const value = String(raw).trim();
    if (!value && key !== 'notas' && key !== 'categoria') continue;
    if (key === 'valor') payload[key] = Number(value);
    else if (key === 'notas' || key === 'categoria') {
      if (value) payload[key] = value;
    } else {
      payload[key] = value;
    }
  }
  return payload;
}

interface PersonalRecordFormProps {
  recordId?: string;
  initialValues?: Record<string, unknown>;
  presetTipo?: HubPersonalTipo;
  onSaved: () => void;
  onCancel?: () => void;
}

export function PersonalRecordForm({
  recordId,
  initialValues,
  presetTipo,
  onSaved,
  onCancel,
}: PersonalRecordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(recordId);
  const merged = { ...initialValues };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);

    const payload = buildPayload(new FormData(e.currentTarget));
    if (!payload.tipo || !payload.descricao || payload.valor == null) {
      setError('Preencha descrição, valor e tipo.');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setError('Sessão inválida.');
      return;
    }

    const row = { ...payload, user_id: userId, updated_at: new Date().toISOString() };

    const { error: err } = isEdit
      ? await supabase.from('hub_personal_transactions').update(row).eq('id', recordId!)
      : await supabase.from('hub_personal_transactions').insert(row);

    if (err) setError(supabaseErrorMessage(err));
    else onSaved();
  };

  const defaultTipo = String(merged.tipo ?? presetTipo ?? 'entrada');
  const defaultData =
    merged.data_referencia != null
      ? String(merged.data_referencia).slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  return (
    <form
      className="card"
      style={{ marginBottom: '0.75rem', display: 'grid', gap: '0.75rem' }}
      onSubmit={handleSubmit}
    >
      <h3 style={{ fontSize: '0.9rem', margin: 0 }}>
        {isEdit ? 'Editar lançamento' : 'Novo lançamento'}
      </h3>

      <div>
        <label className="label" htmlFor="pf-tipo">
          Tipo
        </label>
        <select id="pf-tipo" name="tipo" className="input" defaultValue={defaultTipo} required>
          <option value="entrada">Receita</option>
          <option value="saida">Gasto</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="pf-descricao">
          Descrição
        </label>
        <input
          id="pf-descricao"
          name="descricao"
          type="text"
          className="input"
          defaultValue={String(merged.descricao ?? '')}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="pf-valor">
          Valor (R$)
        </label>
        <input
          id="pf-valor"
          name="valor"
          type="number"
          step="0.01"
          min="0"
          className="input"
          defaultValue={merged.valor != null ? String(merged.valor) : ''}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="pf-data">
          Data
        </label>
        <input
          id="pf-data"
          name="data_referencia"
          type="date"
          className="input"
          defaultValue={defaultData}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="pf-categoria">
          Categoria
        </label>
        <select
          id="pf-categoria"
          name="categoria"
          className="input"
          defaultValue={String(merged.categoria ?? '')}
        >
          <option value="">—</option>
          {PESSOAL_CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="pf-notas">
          Notas
        </label>
        <input
          id="pf-notas"
          name="notas"
          type="text"
          className="input"
          defaultValue={String(merged.notas ?? '')}
        />
      </div>

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

interface PersonalCrudBarProps {
  presetTipo?: HubPersonalTipo;
  onSaved: () => void;
}

export function PersonalCrudBar({ presetTipo, onSaved }: PersonalCrudBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button type="button" className="btn-primary" onClick={() => setOpen(!open)}>
        {open ? 'Cancelar' : 'Adicionar lançamento'}
      </button>
      {open && (
        <div style={{ marginTop: '0.75rem' }}>
          <PersonalRecordForm
            presetTipo={presetTipo}
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

export async function deletePersonalRow(id: string): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado';
  const { error } = await supabase.from('hub_personal_transactions').delete().eq('id', id);
  return error ? supabaseErrorMessage(error) : null;
}
