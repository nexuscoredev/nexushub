import { FormEvent, useState } from 'react';
import { PESSOAL_CATEGORIAS } from '../../lib/pessoal';
import { nextOrdemInGrupo } from '../../lib/pessoalFinanceSummary';
import { supabase, supabaseErrorMessage } from '../../lib/supabase';
import type { HubPersonalContaGrupo, HubPersonalTransaction } from '../../types/database';

const CONTA_KEYS = [
  'descricao',
  'valor',
  'notas',
  'dia_vencimento',
  'categoria',
  'grupo',
  'pago',
  'ordem',
] as const;

function buildContaPayload(fd: FormData): Record<string, unknown> {
  const payload: Record<string, unknown> = { tipo: 'saida' };
  for (const key of CONTA_KEYS) {
    const raw = fd.get(key);
    if (raw == null) continue;
    const value = String(raw).trim();
    if (key === 'valor') payload[key] = Number(value);
    else if (key === 'dia_vencimento') {
      if (value) payload[key] = Number(value);
    } else if (key === 'ordem') {
      if (value) payload[key] = Number(value);
    } else if (key === 'pago') {
      payload[key] = value === 'on' || value === 'true';
    } else if (key === 'categoria' || key === 'notas') {
      if (value) payload[key] = value;
    } else if (value) {
      payload[key] = value;
    }
  }
  return payload;
}

interface PersonalContaFixaFormProps {
  grupo: HubPersonalContaGrupo;
  rows: HubPersonalTransaction[];
  recordId?: string;
  initialValues?: Partial<HubPersonalTransaction>;
  onSaved: (row: HubPersonalTransaction) => void;
  onCancel?: () => void;
}

export function PersonalContaFixaForm({
  grupo,
  rows,
  recordId,
  initialValues,
  onSaved,
  onCancel,
}: PersonalContaFixaFormProps) {
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(recordId);
  const merged = { grupo, ...initialValues };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);

    const payload = buildContaPayload(new FormData(e.currentTarget));
    if (!payload.descricao || payload.valor == null) {
      setError('Preencha descrição e valor.');
      return;
    }

    payload.grupo = grupo;
    payload.tipo = 'saida';
    if (!isEdit && payload.ordem == null) {
      payload.ordem = nextOrdemInGrupo(rows, grupo);
    }
    if (payload.pago == null) payload.pago = false;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setError('Sessão inválida.');
      return;
    }

    const row = {
      ...payload,
      user_id: userId,
      data_referencia: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    };

    if (isEdit) {
      const { data, error: err } = await supabase
        .from('hub_personal_transactions')
        .update(row)
        .eq('id', recordId!)
        .select('*')
        .single();
      if (err) setError(supabaseErrorMessage(err));
      else if (data) onSaved(data as HubPersonalTransaction);
    } else {
      const { data, error: err } = await supabase
        .from('hub_personal_transactions')
        .insert(row)
        .select('*')
        .single();
      if (err) setError(supabaseErrorMessage(err));
      else if (data) onSaved(data as HubPersonalTransaction);
    }
  };

  return (
    <form className="card personal-conta-form" onSubmit={handleSubmit}>
      <h3 style={{ fontSize: '0.9rem', margin: 0 }}>
        {isEdit ? 'Editar conta' : 'Nova conta'}
      </h3>
      <input type="hidden" name="grupo" value={grupo} />

      <div>
        <label className="label" htmlFor="cf-descricao">
          Descrição
        </label>
        <input
          id="cf-descricao"
          name="descricao"
          type="text"
          className="input"
          defaultValue={String(merged.descricao ?? '')}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="cf-valor">
          Valor (R$)
        </label>
        <input
          id="cf-valor"
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
        <label className="label" htmlFor="cf-notas">
          Provedor / notas
        </label>
        <input
          id="cf-notas"
          name="notas"
          type="text"
          className="input"
          placeholder="Ex.: Nubank, Mercado Pago"
          defaultValue={String(merged.notas ?? '')}
        />
      </div>

      <div>
        <label className="label" htmlFor="cf-dia">
          Dia vencimento
        </label>
        <input
          id="cf-dia"
          name="dia_vencimento"
          type="number"
          min="1"
          max="31"
          className="input"
          defaultValue={merged.dia_vencimento ?? ''}
        />
      </div>

      <div>
        <label className="label" htmlFor="cf-categoria">
          Categoria
        </label>
        <select
          id="cf-categoria"
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

      {isEdit && (
        <label className="label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="checkbox"
            name="pago"
            defaultChecked={Boolean(merged.pago)}
            value="true"
          />
          Já pago
        </label>
      )}

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="submit" className="btn-primary">
          {isEdit ? 'Salvar' : 'Adicionar'}
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

export async function deletePersonalConta(id: string): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado';
  const { error } = await supabase.from('hub_personal_transactions').delete().eq('id', id);
  return error ? supabaseErrorMessage(error) : null;
}

export async function togglePersonalContaPago(
  id: string,
  pago: boolean,
): Promise<{ error: string | null; row?: HubPersonalTransaction }> {
  if (!supabase) return { error: 'Supabase não configurado' };
  const { data, error } = await supabase
    .from('hub_personal_transactions')
    .update({ pago, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { error: supabaseErrorMessage(error) };
  return { error: null, row: data as HubPersonalTransaction };
}
