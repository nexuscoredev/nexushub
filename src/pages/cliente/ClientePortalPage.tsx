import { FormEvent, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ClientePortalQuickNav } from '../../components/cliente/ClientePortalQuickNav';
import { ClienteStatusDiario } from '../../components/cliente/ClienteStatusDiario';
import { useAuth } from '../../contexts/AuthContext';
import {
  CLIENTE_PORTAL_NAV,
  CLIENTE_PORTAL_NAV_LIGEIRINHO,
} from '../../lib/clientePortalNav';
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
import { LIGEIRINHO_CONTRATO, LIGEIRINHO_CONTRATO_CLIENT_PATH } from '../../lib/ligeirinhoDocumentacao';
import { LIGEIRINHO_JORNADA_MARCOS } from '../../lib/ligeirinhoJornadaCliente';
import { LIGEIRINHO_STATUS_DIARIO } from '../../lib/ligeirinhoStatusDiario';
import type { StatusDiarioEntry } from '../../lib/ligeirinhoStatusDiario';
import { formatDate } from '../../lib/format';
import { ClienteLigeirinhoPage } from './ClienteLigeirinhoPage';
import { ClienteLigeirinhoParceirosPage } from './ClienteLigeirinhoParceirosPage';
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

  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash;
    if (!hash) return;
    const timer = window.setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const portalNav = isLigeirinho ? CLIENTE_PORTAL_NAV_LIGEIRINHO : CLIENTE_PORTAL_NAV;

  const statusDiarioGenerico = useMemo((): StatusDiarioEntry | null => {
    if (isLigeirinho) return null;
    const hoje = new Date();
    const hojeIso = hoje.toISOString().slice(0, 10);
    const doDia = atualizacoes.filter((a) => a.publicado_em.slice(0, 10) === hojeIso);
    if (doDia.length === 0) return null;
    return {
      dataIso: hojeIso,
      dataLabel: formatDate(hojeIso),
      produto: 'Seu projeto',
      titulo: 'O que mudou hoje',
      secoes: [
        {
          id: 'hoje',
          titulo: 'Atualizações publicadas hoje',
          itens: doDia.map((a) => `${a.titulo} — ${a.mensagem}`),
        },
      ],
    };
  }, [atualizacoes, isLigeirinho]);

  const marcosExibicao = useMemo((): HubClienteMarco[] => {
    if (!isLigeirinho) return marcos;
    return LIGEIRINHO_JORNADA_MARCOS.map((m, index) => ({
      id: `ligeirinho-jornada-${index}`,
      cliente_id: clienteId ?? '',
      titulo: m.titulo,
      descricao: m.descricao,
      fase_ordem: m.fase_ordem,
      status: m.status,
      visivel_cliente: true,
      updated_at: '',
    }));
  }, [clienteId, isLigeirinho, marcos]);

  const progresso = useMemo(
    () => calcularProgressoGeral(marcosExibicao, processos),
    [marcosExibicao, processos],
  );
  const etapaAtual = useMemo(() => marcoAtual(marcosExibicao), [marcosExibicao]);
  const projetoAtivo = useMemo(() => processoPrincipal(processos), [processos]);
  const boasVindas = useMemo(() => mensagemBoasVindas(clienteNome, progresso), [clienteNome, progresso]);

  const marcosConcluidos = marcosExibicao.filter((m) => m.status === 'concluido').length;
  const solicitacoesAbertas = solicitacoes.filter((s) => s.status === 'aberta' || s.status === 'em_analise').length;

  const contratosVisiveis = useMemo(() => {
    if (!isLigeirinho) return contratos;
    const hasContrato = contratos.some((c) => c.titulo.toLowerCase().includes('contrato executivo'));
    if (hasContrato) return contratos;
    const estatico: HubClienteContrato = {
      id: 'static-ligeirinho-contrato',
      cliente_id: clienteId ?? '',
      titulo: LIGEIRINHO_CONTRATO.titulo,
      descricao: `${LIGEIRINHO_CONTRATO.subtitulo}. Investimento ${LIGEIRINHO_CONTRATO.investimentoTotal}.`,
      arquivo_url: LIGEIRINHO_CONTRATO_CLIENT_PATH,
      vigencia_inicio: LIGEIRINHO_CONTRATO.dataAssinaturaIso,
      vigencia_fim: null,
      visivel_cliente: true,
      created_at: LIGEIRINHO_CONTRATO.dataAssinaturaIso,
    };
    return [estatico, ...contratos];
  }, [clienteId, contratos, isLigeirinho]);

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

      <ClientePortalQuickNav items={portalNav} />

      {isLigeirinho ? (
        <ClienteStatusDiario entry={LIGEIRINHO_STATUS_DIARIO} />
      ) : statusDiarioGenerico ? (
        <ClienteStatusDiario entry={statusDiarioGenerico} />
      ) : null}

      {isLigeirinho ? (
        <>
          <div id="hub" className={styles.reportAnchor}>
            <div className={styles.reportSectionHead}>
              <p className={styles.sectionLabel}>Sistema central</p>
              <h2 className={styles.sectionTitle}>Ligeirinho Hub</h2>
            </div>
            <ClienteLigeirinhoPage embedded idPrefix="hub" />
          </div>
          <div id="parceiros" className={styles.reportAnchor}>
            <div className={styles.reportSectionHead}>
              <p className={styles.sectionLabel}>Loja online</p>
              <h2 className={styles.sectionTitle}>Ligeirinho Parceiros</h2>
            </div>
            <ClienteLigeirinhoParceirosPage embedded idPrefix="parceiros" />
          </div>
        </>
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

        {marcosExibicao.length === 0 ? (
          <p className={styles.empty}>Em breve publicaremos as etapas do seu projeto aqui.</p>
        ) : (
          <ol className={styles.timeline}>
            {marcosExibicao.map((marco, index) => (
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
          <p className={styles.sectionLabel}>{isLigeirinho ? 'Histórico' : 'Novidades'}</p>
          <h2 className={styles.sectionTitle}>
            {isLigeirinho ? 'Tudo que já publicamos' : 'O que mudou recentemente'}
          </h2>
          <p className={styles.sectionDesc}>
            {isLigeirinho
              ? 'Arquivo de entregas e comunicados — o resumo do dia está em “Hoje”.'
              : 'Atualizações constantes para você acompanhar sem precisar perguntar.'}
          </p>
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

        {contratosVisiveis.length === 0 ? (
          <p className={styles.empty}>Documentos disponíveis aparecerão aqui quando forem publicados.</p>
        ) : (
          <div className={styles.docGrid}>
            {contratosVisiveis.map((c) => (
              <article key={c.id} className={styles.docCard}>
                <h3 className={styles.docTitle}>{c.titulo}</h3>
                {c.descricao ? <p className={styles.docDesc}>{c.descricao}</p> : null}
                {(c.vigencia_inicio || c.vigencia_fim) && (
                  <p className={styles.docMeta}>
                    Vigência:{' '}
                    {[c.vigencia_inicio, c.vigencia_fim].filter(Boolean).map((d) => formatDate(d!)).join(' — ')}
                  </p>
                )}
                {c.arquivo_url?.startsWith('/cliente') ? (
                  <Link className={styles.docLink} to={c.arquivo_url}>
                    Ver documento
                  </Link>
                ) : c.arquivo_url ? (
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
