import { FormEvent, useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import {
  PROCESSO_STATUS_LABEL,
  SOLICITACAO_STATUS_LABEL,
  criarSolicitacaoCliente,
  listarContratosCliente,
  listarProcessosCliente,
  listarSolicitacoesCliente,
} from '../../lib/clientePortal';
import { formatDate } from '../../lib/format';
import type {
  HubClienteContrato,
  HubClienteProcesso,
  HubClienteSolicitacao,
} from '../../types/clientePortal';
import styles from './ClientePortalPage.module.css';

type Aba = 'processos' | 'solicitacoes' | 'contratos';

export function ClientePortalPage() {
  const { user, clienteConta } = useAuth();
  const clienteId = clienteConta?.cliente_id;

  const [aba, setAba] = useState<Aba>('processos');
  const [processos, setProcessos] = useState<HubClienteProcesso[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<HubClienteSolicitacao[]>([]);
  const [contratos, setContratos] = useState<HubClienteContrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tituloSol, setTituloSol] = useState('');
  const [msgSol, setMsgSol] = useState('');
  const [enviandoSol, setEnviandoSol] = useState(false);

  const recarregar = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    setError(null);
    try {
      const [p, s, c] = await Promise.all([
        listarProcessosCliente(clienteId),
        listarSolicitacoesCliente(clienteId),
        listarContratosCliente(clienteId),
      ]);
      setProcessos(p);
      setSolicitacoes(s);
      setContratos(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const enviarSolicitacao = async (e: FormEvent) => {
    e.preventDefault();
    if (!clienteId || !user?.id) return;
    const titulo = tituloSol.trim();
    const mensagem = msgSol.trim();
    if (!titulo || !mensagem) {
      setError('Preencha título e mensagem.');
      return;
    }
    setEnviandoSol(true);
    setError(null);
    setSuccess(null);
    try {
      await criarSolicitacaoCliente(clienteId, user.id, titulo, mensagem);
      setTituloSol('');
      setMsgSol('');
      setSuccess('Solicitação enviada.');
      await recarregar();
      setAba('solicitacoes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação.');
    } finally {
      setEnviandoSol(false);
    }
  };

  return (
    <div>
      <PageHeader
        badge="Cliente"
        title="Seu portal"
        subtitle={`Olá, ${clienteConta?.nome ?? 'cliente'}. Acompanhe entregas, peça suporte e consulte contratos.`}
      />

      {error && <div className="error-banner" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="info-banner" style={{ marginBottom: '1rem' }}>{success}</div>}

      <div className={styles.tabs} role="tablist">
        {(
          [
            ['processos', 'Processos'],
            ['solicitacoes', 'Solicitações'],
            ['contratos', 'Contratos'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            className={`${styles.tab} ${aba === id ? styles.tabOn : ''}`}
            onClick={() => setAba(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <p className={styles.empty}>Carregando…</p> : null}

      {!loading && aba === 'processos' ? (
        <div className={styles.grid}>
          {processos.length === 0 ? (
            <p className={styles.empty}>Nenhum processo visível no momento.</p>
          ) : (
            processos.map((p) => (
              <article key={p.id} className={`card ${styles.cardItem}`}>
                <div className={styles.cardHead}>
                  <h2 className={styles.cardTitle}>{p.titulo}</h2>
                  <span className={styles.badge}>{PROCESSO_STATUS_LABEL[p.status] ?? p.status}</span>
                </div>
                {p.etapa_atual ? <p className={styles.meta}>Etapa: {p.etapa_atual}</p> : null}
                {p.descricao ? <p className={styles.meta}>{p.descricao}</p> : null}
                <div className={styles.progress} aria-hidden>
                  <div className={styles.progressBar} style={{ width: `${p.progresso_pct}%` }} />
                </div>
                <p className={styles.meta} style={{ marginTop: '0.5rem' }}>
                  {p.progresso_pct}% · atualizado em {formatDate(p.updated_at)}
                </p>
              </article>
            ))
          )}
        </div>
      ) : null}

      {!loading && aba === 'solicitacoes' ? (
        <>
          <form className={`card ${styles.form}`} onSubmit={(e) => void enviarSolicitacao(e)}>
            <h2 className={styles.cardTitle}>Nova solicitação</h2>
            <div className={styles.formRow}>
              <div>
                <label className="label" htmlFor="sol-titulo">
                  Assunto
                </label>
                <input
                  id="sol-titulo"
                  className="input"
                  value={tituloSol}
                  onChange={(e) => setTituloSol(e.target.value)}
                  placeholder="Ex.: Dúvida sobre entrega"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="sol-msg">
                Mensagem
              </label>
              <textarea
                id="sol-msg"
                className="input"
                rows={4}
                value={msgSol}
                onChange={(e) => setMsgSol(e.target.value)}
                placeholder="Descreva o que precisa…"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={enviandoSol} style={{ alignSelf: 'flex-start' }}>
              {enviandoSol ? 'Enviando…' : 'Enviar solicitação'}
            </button>
          </form>

          <div className={styles.grid}>
            {solicitacoes.length === 0 ? (
              <p className={styles.empty}>Nenhuma solicitação ainda.</p>
            ) : (
              solicitacoes.map((s) => (
                <article key={s.id} className={`card ${styles.cardItem}`}>
                  <div className={styles.cardHead}>
                    <h2 className={styles.cardTitle}>{s.titulo}</h2>
                    <span className={styles.badge}>
                      {SOLICITACAO_STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </div>
                  <p className={styles.meta}>{s.mensagem}</p>
                  <p className={styles.meta}>{formatDate(s.created_at)}</p>
                  {s.resposta ? (
                    <div className={styles.resposta}>
                      <strong>Resposta NEXUS:</strong>
                      <p style={{ marginTop: '0.35rem' }}>{s.resposta}</p>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </>
      ) : null}

      {!loading && aba === 'contratos' ? (
        <div className={styles.grid}>
          {contratos.length === 0 ? (
            <p className={styles.empty}>Nenhum contrato disponível.</p>
          ) : (
            contratos.map((c) => (
              <article key={c.id} className={`card ${styles.cardItem}`}>
                <div className={styles.cardHead}>
                  <h2 className={styles.cardTitle}>{c.titulo}</h2>
                </div>
                {c.descricao ? <p className={styles.meta}>{c.descricao}</p> : null}
                {(c.vigencia_inicio || c.vigencia_fim) && (
                  <p className={styles.meta}>
                    Vigência:{' '}
                    {[c.vigencia_inicio, c.vigencia_fim].filter(Boolean).map((d) => formatDate(d!)).join(' — ')}
                  </p>
                )}
                {c.arquivo_url ? (
                  <p style={{ marginTop: '0.65rem' }}>
                    <a className={styles.link} href={c.arquivo_url} target="_blank" rel="noopener noreferrer">
                      Abrir documento
                    </a>
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
