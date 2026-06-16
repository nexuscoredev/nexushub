import { FormEvent, useMemo, useState } from 'react';
import type { FinanceFluxoSecao } from '../lib/financeCategories';
import {
  parseParcelasFromInvestment,
  persistInvestment,
  stripUserNotas,
  type ParcelasState,
  valorParcela,
} from '../lib/investmentParcelas';
import { formatBRL } from '../lib/format';
import { supabase } from '../lib/supabase';
import type { HubFinanceInvestment } from '../types/database';
import styles from '../pages/FinanceiroPage.module.css';

interface InvestmentFinanceFormProps {
  recordId?: string;
  initialValues?: HubFinanceInvestment;
  preset?: Record<string, unknown>;
  fluxoSecao?: FinanceFluxoSecao;
  onSaved: () => void;
  onCancel?: () => void;
}

export function InvestmentFinanceForm({
  recordId,
  initialValues,
  preset,
  fluxoSecao,
  onSaved,
  onCancel,
}: InvestmentFinanceFormProps) {
  const initialParcelas = useMemo(
    () => (initialValues ? parseParcelasFromInvestment(initialValues) : null),
    [initialValues],
  );

  const [error, setError] = useState<string | null>(null);
  const [parcelado, setParcelado] = useState(initialParcelas?.parcelado ?? false);
  const [qtdParcelasInput, setQtdParcelasInput] = useState(
    String(initialParcelas?.parcelado ? Math.max(1, initialParcelas.qtd_parcelas) : 2),
  );
  const [pagas, setPagas] = useState<number[]>(initialParcelas?.parcelas_pagas ?? []);
  const [avistaPago, setAvistaPago] = useState(
    () => !(initialParcelas?.parcelado ?? false) && (initialParcelas?.parcelas_pagas.length ?? 0) > 0,
  );
  const [valor, setValor] = useState(String(initialValues?.valor ?? ''));

  const qtdParcelasParsed = Math.min(
    60,
    Math.max(1, parseInt(qtdParcelasInput.replace(/\D/g, ''), 10) || 1),
  );

  const parcelasState: ParcelasState = parcelado
    ? {
        parcelado: true,
        qtd_parcelas: qtdParcelasParsed,
        parcelas_pagas: [...pagas].sort((a, b) => a - b),
      }
    : { parcelado: false, qtd_parcelas: 1, parcelas_pagas: avistaPago ? [1] : [] };

  const valorNum = Number(valor) || 0;
  const resumoParcela = valorNum > 0 ? formatBRL(valorParcela(valorNum, parcelasState)) : '—';

  const toggleParcela = (n: number) => {
    setPagas((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b)));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    if (parcelado && !qtdParcelasInput.trim()) {
      setError('Informe a quantidade de parcelas.');
      return;
    }
    const fd = new FormData(e.currentTarget);

    const err = await persistInvestment(
      supabase,
      recordId ?? null,
      {
        titulo: String(fd.get('titulo')),
        valor: Number(fd.get('valor')),
        tipo: String(preset?.tipo ?? initialValues?.tipo ?? 'Saída'),
        responsavel: String(fd.get('responsavel')),
        data_investimento: String(fd.get('data_investimento') ?? '').trim() || undefined,
        notas: String(fd.get('notas') ?? '').trim() || undefined,
      },
      parcelasState,
      fluxoSecao,
    );

    if (err) setError(err);
    else onSaved();
  };

  return (
    <form
      className="card"
      style={{ marginBottom: '0.75rem', display: 'grid', gap: '0.75rem' }}
      onSubmit={handleSubmit}
    >
      <h3 style={{ fontSize: '0.9rem', margin: 0 }}>
        {recordId ? 'Editar registro' : 'Novo registro'}
      </h3>

      <div>
        <label className="label" htmlFor="titulo">
          Descrição
        </label>
        <input
          id="titulo"
          name="titulo"
          className="input"
          defaultValue={initialValues?.titulo}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="valor">
          Valor total
        </label>
        <input
          id="valor"
          name="valor"
          type="number"
          className="input"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="responsavel">
          Responsável
        </label>
        <select
          id="responsavel"
          name="responsavel"
          className="input"
          defaultValue={initialValues?.responsavel ?? 'Rafael'}
          required
        >
          <option value="Rafael">Rafael</option>
          <option value="Vinícius">Vinícius</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="data_investimento">
          Data
        </label>
        <input
          id="data_investimento"
          name="data_investimento"
          type="date"
          className="input"
          defaultValue={initialValues?.data_investimento?.slice(0, 10)}
        />
      </div>

      <div className={styles.parcelasForm}>
        <span className="label">Parcelas?</span>
        <div className={styles.radioRow}>
          <label>
            <input
              type="radio"
              name="parcelado_ui"
              checked={!parcelado}
              onChange={() => {
                setParcelado(false);
                setPagas([]);
              }}
            />
            Não (à vista)
          </label>
          <label>
            <input
              type="radio"
              name="parcelado_ui"
              checked={parcelado}
              onChange={() => {
                setParcelado(true);
                if (!qtdParcelasInput.trim()) setQtdParcelasInput('2');
              }}
            />
            Sim
          </label>
        </div>

        {!parcelado ? (
          <label className={styles.parcelaChip}>
            <input
              type="checkbox"
              checked={avistaPago}
              onChange={(e) => setAvistaPago(e.target.checked)}
            />
            Pago à vista
          </label>
        ) : (
          <>
            <div>
              <label className="label" htmlFor="qtd_parcelas">
                Quantidade de parcelas
              </label>
              <input
                id="qtd_parcelas"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input"
                placeholder="Ex.: 5"
                value={qtdParcelasInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setQtdParcelasInput(raw);
                  const n = parseInt(raw, 10);
                  if (n >= 1) setPagas((prev) => prev.filter((p) => p <= n));
                }}
                onBlur={() => {
                  const n = Math.min(60, Math.max(1, parseInt(qtdParcelasInput, 10) || 1));
                  setQtdParcelasInput(String(n));
                  setPagas((prev) => prev.filter((p) => p <= n));
                }}
              />
            </div>
            <span className="label" style={{ marginBottom: 0 }}>
              Parcelas pagas ({resumoParcela} cada)
            </span>
            <div className={styles.parcelasRow}>
              {Array.from(
                {
                  length:
                    qtdParcelasInput.trim() === '' ? 0 : qtdParcelasParsed,
                },
                (_, i) => i + 1,
              ).map((n) => (
                <label key={n} className={styles.parcelaChip}>
                  <input
                    type="checkbox"
                    checked={pagas.includes(n)}
                    onChange={() => toggleParcela(n)}
                  />
                  {n}ª
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      <div>
        <label className="label" htmlFor="notas">
          Notas
        </label>
        <input
          id="notas"
          name="notas"
          className="input"
          defaultValue={stripUserNotas(initialValues?.notas)}
        />
      </div>

      {error && <div className="error-banner">{error}</div>}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="submit" className="btn-primary">
          {recordId ? 'Salvar alterações' : 'Salvar'}
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
