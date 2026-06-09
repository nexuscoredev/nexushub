import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PersonalContasFixasView } from '../components/PersonalContasFixasView';
import { PageHeader } from '../components/PageHeader';
import {
  deletePersonalRow,
  PersonalCrudBar,
  PersonalRecordForm,
} from '../components/PersonalFinanceCrud';
import { PersonalKpiStrip } from '../components/PersonalKpiStrip';
import { useAuth } from '../contexts/AuthContext';
import { formatBRL, formatDate } from '../lib/format';
import {
  categoriaPessoalLabel,
  saldoPessoal,
  totalEntradasPessoal,
  totalSaidasPessoal,
} from '../lib/pessoal';
import { supabase, supabaseErrorMessage } from '../lib/supabase';
import { isViniciusPersonalFinance } from '../lib/viniciusPersonalFinance';
import type { HubPersonalTipo, HubPersonalTransaction } from '../types/database';
import financeStyles from './FinanceiroPage.module.css';
import styles from './PessoalPage.module.css';

type PessoalSecao = 'financeiro';
type ViniciusFinanceView = 'contas' | 'receitas' | 'outros';

export function PessoalPage() {
  const { profile, user } = useAuth();
  const viniciusLayout = isViniciusPersonalFinance(profile?.email ?? user?.email);
  const [secao, setSecao] = useState<PessoalSecao>('financeiro');
  const [viniciusView, setViniciusView] = useState<ViniciusFinanceView>('contas');
  const [fluxo, setFluxo] = useState<HubPersonalTipo>('entrada');
  const [rows, setRows] = useState<HubPersonalTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('hub_personal_transactions')
      .select('*')
      .order('grupo', { ascending: true, nullsFirst: false })
      .order('ordem', { ascending: true })
      .order('data_referencia', { ascending: false });
    if (err) setError(supabaseErrorMessage(err));
    else setRows((data ?? []) as HubPersonalTransaction[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const entradas = useMemo(() => rows.filter((r) => r.tipo === 'entrada'), [rows]);
  const saidasGenericas = useMemo(
    () => rows.filter((r) => r.tipo === 'saida' && !r.grupo),
    [rows],
  );
  const fluxoRows = fluxo === 'entrada' ? entradas : saidasGenericas;

  const firstName = profile?.nome?.trim().split(/\s+/)[0] ?? 'você';

  return (
    <div className={styles.page}>
      <PageHeader
        badge="Personal"
        title="Área pessoal"
        subtitle={`Espaço privado de ${firstName} — só você vê estes dados.`}
      />

      {error && (
        <div className="error-banner" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className={styles.areaTabs}>
        <button
          type="button"
          className={`${styles.areaTab} ${secao === 'financeiro' ? styles.areaTabActive : ''}`}
          onClick={() => setSecao('financeiro')}
        >
          Financeiro pessoal
        </button>
      </div>

      {secao === 'financeiro' && (
        <>
          <PersonalKpiStrip
            values={{
              entradas: totalEntradasPessoal(rows),
              saidas: totalSaidasPessoal(rows),
              saldo: saldoPessoal(rows),
            }}
          />

          {viniciusLayout ? (
            <>
              <div className="tabs">
                {(
                  [
                    ['contas', 'Contas Fixas'],
                    ['receitas', 'Receitas'],
                    ['outros', 'Outros gastos'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`tab ${viniciusView === id ? 'active' : ''}`}
                    onClick={() => setViniciusView(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {loading ? (
                <p style={{ color: 'var(--muted)' }}>Carregando…</p>
              ) : viniciusView === 'contas' ? (
                <PersonalContasFixasView rows={rows} onRefresh={load} />
              ) : (
                <div className={financeStyles.sections}>
                  <PessoalQueueSection
                    title={viniciusView === 'receitas' ? 'Receitas' : 'Outros gastos'}
                    subtitle={
                      viniciusView === 'receitas'
                        ? 'Salário, extras e rendimentos'
                        : 'Gastos fora das contas fixas'
                    }
                    totalLabel={formatBRL(
                      (viniciusView === 'receitas' ? entradas : saidasGenericas).reduce(
                        (sum, r) => sum + Number(r.valor),
                        0,
                      ),
                    )}
                  >
                    <PersonalTransactionsTable
                      rows={viniciusView === 'receitas' ? entradas : saidasGenericas}
                      presetTipo={viniciusView === 'receitas' ? 'entrada' : 'saida'}
                      onRefresh={load}
                    />
                  </PessoalQueueSection>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="tabs">
                {(
                  [
                    ['entrada', 'Receitas'],
                    ['saida', 'Gastos'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`tab ${fluxo === id ? 'active' : ''}`}
                    onClick={() => setFluxo(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {loading ? (
                <p style={{ color: 'var(--muted)' }}>Carregando…</p>
              ) : (
                <div className={financeStyles.sections}>
                  <PessoalQueueSection
                    title={fluxo === 'entrada' ? 'Receitas' : 'Gastos'}
                    subtitle={
                      fluxo === 'entrada'
                        ? 'Salário, extras, rendimentos e outras entradas'
                        : 'Despesas, compras e saídas do dia a dia'
                    }
                    totalLabel={formatBRL(
                      fluxoRows.reduce((sum, r) => sum + Number(r.valor), 0),
                    )}
                  >
                    <PersonalTransactionsTable
                      rows={fluxoRows}
                      presetTipo={fluxo}
                      onRefresh={load}
                    />
                  </PessoalQueueSection>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function PessoalQueueSection({
  title,
  subtitle,
  totalLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  totalLabel: string;
  children: ReactNode;
}) {
  return (
    <section className={financeStyles.section}>
      <div className={financeStyles.sectionHeader}>
        <div>
          <h2 className={financeStyles.sectionTitle}>{title}</h2>
          {subtitle && <p className={financeStyles.sectionSubtitle}>{subtitle}</p>}
        </div>
        <span className={financeStyles.sectionMeta}>{totalLabel}</span>
      </div>
      <div className={financeStyles.sectionBody}>{children}</div>
    </section>
  );
}

function PersonalTransactionsTable({
  rows,
  presetTipo,
  onRefresh,
}: {
  rows: HubPersonalTransaction[];
  presetTipo: HubPersonalTipo;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState<HubPersonalTransaction | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return;
    const err = await deletePersonalRow(id);
    if (err) alert(err);
    else onRefresh();
  };

  return (
    <div className={`table-wrap ${financeStyles.financeMobileCards}`}>
      <PersonalCrudBar presetTipo={presetTipo} onSaved={onRefresh} />
      {editing && (
        <PersonalRecordForm
          recordId={editing.id}
          initialValues={editing as unknown as Record<string, unknown>}
          onSaved={() => {
            setEditing(null);
            onRefresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>descrição</th>
            <th>valor</th>
            <th>categoria</th>
            <th>data</th>
            <th>notas</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td data-label="descrição">{row.descricao}</td>
              <td data-label="valor">{formatBRL(Number(row.valor))}</td>
              <td data-label="categoria">{categoriaPessoalLabel(row.categoria)}</td>
              <td data-label="data">{formatDate(row.data_referencia)}</td>
              <td data-label="notas">{row.notas ?? '—'}</td>
              <td className={financeStyles.cellActions} data-label="Ações">
                <button type="button" className="btn-ghost" onClick={() => setEditing(row)}>
                  Editar
                </button>
                <button type="button" className="btn-ghost" onClick={() => void handleDelete(row.id)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p style={{ color: 'var(--muted)', padding: '0.75rem 0' }}>
          Nenhum lançamento nesta fila. Use &quot;Adicionar lançamento&quot; para começar.
        </p>
      )}
    </div>
  );
}
