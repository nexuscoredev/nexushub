import { FormEvent, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { clienteLogoUrl } from '../../lib/vaultClientes';
import {
  ATUALIZACAO_TIPO_LABEL,
  MARCO_STATUS_LABEL,
  calcularProgressoGeral,
  formatRelativeTime,
  marcoAtual,
  mensagemBoasVindas,
  processoPrincipal,
  PROCESSO_STATUS_AMIGAVEL,
} from '../../lib/clienteDashboard';
import {
  SOLICITACAO_STATUS_LABEL,
  criarSolicitacaoCliente,
  listarAtualizacoesCliente,
  listarContratosCliente,
  listarMarcosCliente,
  listarProcessosCliente,
  listarSolicitacoesCliente,
} from '../../lib/clientePortal';
import { formatDate } from '../../lib/format';
import type {
  HubClienteAtualizacao,
  HubClienteContrato,
  HubClienteMarco,
  HubClienteProcesso,
  HubClienteSolicitacao,
} from '../../types/clientePortal';
import styles from './ClientePortalPage.module.css';

export function ClientePortalPage() {
  const { user, clienteConta } = useAuth();
  const clienteId = clienteConta?.cliente_id;
  const clienteNome = clienteConta?.cliente?.nome ?? 'Cliente';
  const isLigeirinho = clienteConta?.cliente?.slug === 'ligeirinho';
  const logoUrl = clienteConta?.cliente ? clienteLogoUrl(clienteConta.cliente) : null;

  const [processos, setProcessos] = useState<HubClienteProcesso[]>([]);
  const [marcos, setMarcos] = useState<HubClienteMarco[]>([]);
  const [atualizacoes, setAtualizacoes] = useState<HubClienteAtualizacao[]>([]);
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
      const [p, m, a, s, c] = await Promise.all([
        listarProcessosCliente(clienteId),
        listarMarcosCliente(clienteId),
        listarAtualizacoesCliente(clienteId),
        listarSolicitacoesCliente(clienteId),
        listarContratosCliente(clienteId),
      ]);
      setProcessos(p);
      setMarcos(m);
      setAtualizacoes(a);
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

  const progresso = useMemo(() => calcularProgressoGeral(marcos, processos), [marcos, processos]);
  const etapaAtual = useMemo(() => marcoAtual(marcos), [marcos]);
  const projetoAtivo = useMemo(() => processoPrincipal(processos), [processos]);
  const boasVindas = useMemo(() => mensagemBoasVindas(clienteNome, progresso), [clienteNome, progresso]);

  const marcosConcluidos = marcos.filter((m) => m.status === 'concluido').length;
  const solicitacoesAbertas = solicitacoes.filter((s) => s.status === 'aberta' || s.status === 'em_analise').length;

  const enviarSolicitacao = async (e: FormEvent) => {
    e.preventDefault();
    if (!clienteId || !user?.id) return;
    const titulo = tituloSol.trim();
    const mensagem = msgSol.trim();
    if (!titulo || !mensagem) {
      setError('Preencha assunto e mensagem.');
      return;
    }
    setEnviandoSol(true);
    setError(null);
    setSuccess(null);
    try {
      await criarSolicitacaoCliente(clienteId, user.id, titulo, mensagem);
      setTituloSol('');
      setMsgSol('');
      setSuccess('Recebemos sua mensagem. A equipe NEXUS responde em breve.');
      await recarregar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem.');
    } finally {
      setEnviandoSol(false);
    }
  };

  if (loading) {
    return <p className={styles.loading}>Preparando seu painel…</p>;
  }

  return (
    <div className={styles.page}>
      {error && <div className={styles.bannerError}>{error}</div>}
      {success && <div className={styles.bannerInfo}>{success}</div>}

      <section id="inicio" className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>NexusClient</p>
          <h1 className={styles.heroTitle}>Olá, {clienteConta?.nome?.split(' ')[0] ?? 'bem-vindo(a)'}</h1>
          <p className={styles.heroLead}>{boasVindas}</p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{progresso}%</span>
              <span className={styles.statLabel}>Andamento geral</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{marcosConcluidos}/{marcos.length || '—'}</span>
              <span className={styles.statLabel}>Etapas concluídas</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{solicitacoesAbertas}</span>
              <span className={styles.statLabel}>Pedidos em aberto</span>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden={!logoUrl}>
          <div className={styles.progressRing} style={{ '--progress': `${progresso}%` } as CSSProperties}>
            <div className={styles.progressRingInner}>
              {logoUrl ? (
                <img src={logoUrl} alt="" className={styles.clientLogo} />
              ) : (
                <span className={styles.progressPct}>{progresso}%</span>
              )}
            </div>
          </div>
          {etapaAtual ? (
            <p className={styles.heroStage}>
              Agora: <strong>{etapaAtual.titulo}</strong>
            </p>
          ) : null}
        </div>
      </section>

      {isLigeirinho ? (
        <section className={styles.ligeirinhoReports} aria-labelledby="ligeirinho-reports-title">
          <div className={styles.ligeirinhoReportsHead}>
            <p className={styles.sectionLabel}>Seus sistemas</p>
            <h2 id="ligeirinho-reports-title" className={styles.sectionTitle}>
              Relatórios Ligeirinho
            </h2>
            <p className={styles.sectionDesc}>
              Dois produtos, dois relatórios — Hub para operação interna e Parceiros para a loja online.
            </p>
          </div>
          <div className={styles.ligeirinhoReportsGrid}>
            <article className={styles.ligeirinhoReportCard}>
              <h3 className={styles.ligeirinhoReportTitle}>Ligeirinho Hub</h3>
              <p className={styles.ligeirinhoReportDesc}>
                PDV, fila, cadastros, marketing com IA e administração da operação.
              </p>
              <Link to="/cliente/ligeirinho" className={styles.ligeirinhoCtaBtn}>
                Ver relatório Hub
              </Link>
            </article>
            <article className={`${styles.ligeirinhoReportCard} ${styles.ligeirinhoReportCardParceiros}`}>
              <h3 className={styles.ligeirinhoReportTitle}>Ligeirinho Parceiros</h3>
              <p className={styles.ligeirinhoReportDesc}>
                App de pedidos online — catálogo, login, Mercado Pago e jornada do cliente final.
              </p>
              <Link to="/cliente/ligeirinho-parceiros" className={styles.ligeirinhoCtaBtn}>
                Ver relatório Parceiros
              </Link>
            </article>
          </div>
        </section>
      ) : null}

      {projetoAtivo ? (
        <section className={styles.highlight} aria-labelledby="projeto-ativo-title">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>O que estamos entregando</p>
            <h2 id="projeto-ativo-title" className={styles.sectionTitle}>{projetoAtivo.titulo}</h2>
          </div>
          <div className={styles.highlightCard}>
            <div className={styles.highlightTop}>
              <span className={styles.highlightBadge}>
                {PROCESSO_STATUS_AMIGAVEL[projetoAtivo.status] ?? projetoAtivo.status}
              </span>
              {projetoAtivo.etapa_atual ? (
                <span className={styles.highlightMeta}>Etapa: {projetoAtivo.etapa_atual}</span>
              ) : null}
            </div>
            {projetoAtivo.descricao ? <p className={styles.highlightText}>{projetoAtivo.descricao}</p> : null}
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${projetoAtivo.progresso_pct}%` }} />
            </div>
            <p className={styles.progressCaption}>{projetoAtivo.progresso_pct}% do caminho percorrido</p>
          </div>
        </section>
      ) : null}

      <section id="jornada" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionLabel}>Sua jornada</p>
          <h2 className={styles.sectionTitle}>Do primeiro contato ao go-live</h2>
          <p className={styles.sectionDesc}>
            Cada etapa traduz o nosso trabalho em linguagem clara — sem termos técnicos.
          </p>
        </div>

        {marcos.length === 0 ? (
          <p className={styles.empty}>Em breve publicaremos as etapas do seu projeto aqui.</p>
        ) : (
          <ol className={styles.timeline}>
            {marcos.map((marco, index) => (
              <li
                key={marco.id}
                className={`${styles.timelineItem} ${styles[`timeline_${marco.status}`]}`}
              >
                <div className={styles.timelineMarker}>
                  <span>{index + 1}</span>
                </div>
                <article className={styles.timelineCard}>
                  <div className={styles.timelineHead}>
                    <h3 className={styles.timelineTitle}>{marco.titulo}</h3>
                    <span className={styles.timelineBadge}>{MARCO_STATUS_LABEL[marco.status] ?? marco.status}</span>
                  </div>
                  {marco.descricao ? <p className={styles.timelineDesc}>{marco.descricao}</p> : null}
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section id="novidades" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionLabel}>Novidades</p>
          <h2 className={styles.sectionTitle}>O que mudou recentemente</h2>
          <p className={styles.sectionDesc}>Atualizações constantes para você acompanhar sem precisar perguntar.</p>
        </div>

        {atualizacoes.length === 0 ? (
          <p className={styles.empty}>Nenhuma novidade publicada ainda.</p>
        ) : (
          <ul className={styles.feed}>
            {atualizacoes.map((item) => (
              <li key={item.id} className={styles.feedItem}>
                <div className={styles.feedMeta}>
                  <span className={`${styles.feedTag} ${styles[`feedTag_${item.tipo}`]}`}>
                    {ATUALIZACAO_TIPO_LABEL[item.tipo] ?? item.tipo}
                  </span>
                  <time dateTime={item.publicado_em}>{formatRelativeTime(item.publicado_em)}</time>
                </div>
                <h3 className={styles.feedTitle}>{item.titulo}</h3>
                <p className={styles.feedText}>{item.mensagem}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="contato" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionLabel}>Contato</p>
          <h2 className={styles.sectionTitle}>Fale com a NEXUS</h2>
          <p className={styles.sectionDesc}>Dúvidas, pedidos ou feedback — envie aqui e acompanhe a resposta.</p>
        </div>

        <div className={styles.contactGrid}>
          <form className={styles.form} onSubmit={(e) => void enviarSolicitacao(e)}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="sol-titulo">
                Assunto
              </label>
              <input
                id="sol-titulo"
                className={styles.input}
                value={tituloSol}
                onChange={(e) => setTituloSol(e.target.value)}
                placeholder="Ex.: Dúvida sobre a próxima entrega"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="sol-msg">
                Mensagem
              </label>
              <textarea
                id="sol-msg"
                className={`${styles.input} ${styles.textarea}`}
                rows={4}
                value={msgSol}
                onChange={(e) => setMsgSol(e.target.value)}
                placeholder="Conte o que precisa, com calma…"
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={enviandoSol}>
              {enviandoSol ? 'Enviando…' : 'Enviar mensagem'}
            </button>
          </form>

          <div className={styles.messages}>
            <h3 className={styles.messagesTitle}>Suas mensagens</h3>
            {solicitacoes.length === 0 ? (
              <p className={styles.emptyInline}>Nenhuma mensagem enviada ainda.</p>
            ) : (
              <ul className={styles.messageList}>
                {solicitacoes.slice(0, 5).map((s) => (
                  <li key={s.id} className={styles.messageItem}>
                    <div className={styles.messageHead}>
                      <strong>{s.titulo}</strong>
                      <span className={styles.messageBadge}>
                        {SOLICITACAO_STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </div>
                    <p className={styles.messageText}>{s.mensagem}</p>
                    <time className={styles.messageTime}>{formatDate(s.created_at)}</time>
                    {s.resposta ? (
                      <div className={styles.resposta}>
                        <strong>Resposta NEXUS</strong>
                        <p>{s.resposta}</p>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section id="documentos" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionLabel}>Documentos</p>
          <h2 className={styles.sectionTitle}>Contratos e arquivos</h2>
        </div>

        {contratos.length === 0 ? (
          <p className={styles.empty}>Documentos disponíveis aparecerão aqui quando forem publicados.</p>
        ) : (
          <div className={styles.docGrid}>
            {contratos.map((c) => (
              <article key={c.id} className={styles.docCard}>
                <h3 className={styles.docTitle}>{c.titulo}</h3>
                {c.descricao ? <p className={styles.docDesc}>{c.descricao}</p> : null}
                {(c.vigencia_inicio || c.vigencia_fim) && (
                  <p className={styles.docMeta}>
                    Vigência:{' '}
                    {[c.vigencia_inicio, c.vigencia_fim].filter(Boolean).map((d) => formatDate(d!)).join(' — ')}
                  </p>
                )}
                {c.arquivo_url ? (
                  <a className={styles.docLink} href={c.arquivo_url} target="_blank" rel="noopener noreferrer">
                    Abrir documento
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
