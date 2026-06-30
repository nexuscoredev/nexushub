import { useMemo, useState, useEffect, type CSSProperties, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import {
  ADEGA_CANAIS,
  ADEGA_PIPELINE,
  COLETA_PIPELINE,
  DEMO_BANNER,
  DEMO_CATALOG,
  resolveDemoId,
  type DemoId,
} from '../data/sistemaDemoCatalog';
import {
  useDemoSessionData,
  type BebidasSessionData,
  type ColetaSessionData,
} from '../data/sistemaDemoRandomize';
import { SistemaDemoChat } from '../components/SistemaDemoChat';
import styles from './SistemaDemoPage.module.css';

function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('conclu') || s.includes('finaliz') || s.includes('entregue') || s === 'ok' || s === 'pronto') {
    return styles.statusOk;
  }
  if (s.includes('andamento') || s.includes('separando') || s.includes('emitido') || s.includes('rota') || s.includes('coleta')) {
    return styles.statusWarn;
  }
  return styles.statusMuted;
}

function DemoScreen({ screen, children }: { screen: string; children: ReactNode }) {
  return (
    <div key={screen} className={styles.screenEnter}>
      {children}
    </div>
  );
}

function formatBrl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function Fv({ children }: { children: ReactNode }) {
  return (
    <span className={styles.ficticioWrap}>
      {children}
      <span className={styles.ficticioMark}>fictício</span>
    </span>
  );
}

function countGrouped<T>(
  items: readonly T[],
  getLabel: (item: T) => string,
  order?: string[],
): { label: string; pct: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = getLabel(item);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const total = items.length || 1;
  const entries = [...counts.entries()];
  if (order) {
    entries.sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  } else {
    entries.sort((a, b) => b[1] - a[1]);
  }
  return entries.map(([label, count]) => ({ label, pct: Math.round((count / total) * 100) }));
}

function parseBrl(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function shortLabel(text: string, max = 16) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function buildHourBars(items: { hora: string }[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const hour = `${item.hora.split(':')[0]}h`;
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }));
}

export function SistemaDemoPage() {
  const { demoId: rawId } = useParams<{ demoId: string }>();
  const location = useLocation();
  const [screen, setScreen] = useState('inicio');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pedidoStatuses, setPedidoStatuses] = useState<Record<string, string>>({});
  const [popProductId, setPopProductId] = useState<string | null>(null);
  const [saleFlash, setSaleFlash] = useState(false);

  const resolvedId = resolveDemoId(rawId);
  const session = useDemoSessionData(resolvedId ?? 'coleta', location.key);

  useEffect(() => {
    setScreen('inicio');
    setCart({});
    setPedidoStatuses({});
    setPopProductId(null);
    setSaleFlash(false);
  }, [location.key]);
  const coleta = session.demoId === 'coleta' ? session : null;
  const bebidas = session.demoId === 'ligeirinho' ? session : null;

  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

  const cartTotal = useMemo(() => {
    if (!bebidas) return 0;
    return bebidas.produtos.reduce((sum, p) => sum + (cart[p.id] ?? 0) * p.preco, 0);
  }, [cart, bebidas]);

  if (rawId === 'adega' || rawId === 'varejo') {
    return <Navigate to="/sistemas/demo/ligeirinho" replace />;
  }

  if (rawId === 'logistica') {
    return <Navigate to="/sistemas" replace />;
  }

  if (!resolvedId) {
    return <Navigate to="/sistemas" replace />;
  }

  const demoId: DemoId = resolvedId;
  const demo = DEMO_CATALOG[demoId];
  const operatorName = session.operatorName;

  const goTo = (next: string) => setScreen(next);

  const addToCart = (productId: string) => {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
    setPopProductId(productId);
    window.setTimeout(() => setPopProductId((id) => (id === productId ? null : id)), 400);
  };

  const advancePedido = (id: string, current: string) => {
    const flow = ['Na fila', 'Separando', 'Pronto', 'Entregue'];
    const idx = flow.indexOf(pedidoStatuses[id] ?? current);
    const next = flow[Math.min(idx + 1, flow.length - 1)];
    setPedidoStatuses((prev) => ({ ...prev, [id]: next }));
  };

  const finishSale = () => {
    if (cartCount === 0) return;
    setSaleFlash(true);
    setCart({});
    window.setTimeout(() => setSaleFlash(false), 1200);
  };

  const renderBarChart = (title: string, bars: { label: string; value: number }[]) => {
    const max = Math.max(...bars.map((b) => b.value), 1);
    return (
    <div className={styles.chartCard}>
      <span className={styles.chartLabel}>{title}</span>
      <div className={styles.barChart} role="img" aria-label={`${title} — dados fictícios`}>
        {bars.map((bar, i) => (
          <div key={bar.label} className={styles.barCol}>
            <div
              className={styles.bar}
              style={
                {
                  '--bar-h': `${Math.round((bar.value / max) * 100)}%`,
                  '--bar-i': i,
                } as CSSProperties
              }
            />
            <span className={styles.barLabel}>{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
    );
  };

  const renderLineChart = (title: string, points: { label: string; value: number }[], delta: string) => {
    const max = Math.max(...points.map((p) => p.value));
    const min = Math.min(...points.map((p) => p.value));
    const range = max - min || 1;
    const width = 100;
    const height = 44;
    const padX = 6;
    const padY = 6;

    const coords = points.map((point, i) => {
      const x = padX + (i / Math.max(points.length - 1, 1)) * (width - padX * 2);
      const y = height - padY - ((point.value - min) / range) * (height - padY * 2);
      return { ...point, x, y };
    });

    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

    return (
      <div className={`${styles.chartCard} ${styles.chartCardWide}`}>
        <div className={styles.chartCardHead}>
          <span className={styles.chartLabel}>{title}</span>
          <span className={styles.lineChartDelta}>
            <Fv>{delta}</Fv>
          </span>
        </div>
        <div className={styles.lineChartWrap} role="img" aria-label={`${title} — ${delta}`}>
          <svg viewBox={`0 0 ${width} ${height}`} className={styles.lineChartSvg} preserveAspectRatio="none">
            <defs>
              <linearGradient id="coletaLineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--demo-accent)" stopOpacity="0.38" />
                <stop offset="100%" stopColor="var(--demo-accent)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line
                key={ratio}
                x1={padX}
                x2={width - padX}
                y1={padY + ratio * (height - padY * 2)}
                y2={padY + ratio * (height - padY * 2)}
                className={styles.lineChartGrid}
              />
            ))}
            <path d={areaPath} fill="url(#coletaLineFill)" className={styles.lineChartArea} />
            <path d={linePath} className={styles.lineChartPath} />
            {coords.map((c, i) => (
              <circle key={c.label} cx={c.x} cy={c.y} r="1.35" className={styles.lineChartDot} style={{ '--dot-i': i } as CSSProperties} />
            ))}
          </svg>
          <div className={styles.lineChartLabels}>
            {points.map((p) => (
              <span key={p.label}>{p.label}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderProgressList = (title: string, items: { label: string; pct: number }[]) => (
    <div className={styles.panelCard}>
      <span className={styles.panelTitle}>{title}</span>
      <ul className={styles.progressList}>
        {items.map((item, i) => (
          <li key={item.label} className={styles.progressRow} style={{ '--stagger': i } as CSSProperties}>
            <div className={styles.progressMeta}>
              <span>{item.label}</span>
              <span className={styles.progressPct}>
                <Fv>{item.pct}%</Fv>
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ '--pct': `${item.pct}%` } as CSSProperties} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderEventList = (title: string, events: { hora: string; texto: string }[]) => (
    <div className={styles.panelCard}>
      <span className={styles.panelTitle}>{title}</span>
      <ul className={styles.eventList}>
        {events.map((ev, i) => (
          <li key={`${ev.hora}-${i}`} className={styles.eventRow} style={{ '--stagger': i } as CSSProperties}>
            <span className={styles.eventTime}>{ev.hora}</span>
            <span className={styles.eventText}>
              <Fv>{ev.texto}</Fv>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderQuickStats = (items: { icon: string; label: string; value: string }[]) => (
    <div className={styles.quickStats}>
      {items.map((item, i) => (
        <div key={item.label} className={styles.quickStat} style={{ '--stagger': i } as CSSProperties}>
          <span className="material-symbols-outlined" aria-hidden>
            {item.icon}
          </span>
          <div>
            <span className={styles.quickStatLabel}>{item.label}</span>
            <strong className={styles.quickStatValue}>
              <Fv>{item.value}</Fv>
            </strong>
          </div>
        </div>
      ))}
    </div>
  );

  const renderKpiGrid = (kpis: { label: string; value: string; delta: string }[]) => (
    <div className={styles.kpiGrid}>
      {kpis.map((k, i) => (
        <article
          key={`${k.label}-${i}`}
          className={styles.kpiCard}
          style={{ '--stagger': i } as CSSProperties}
        >
          <span className={styles.kpiLabel}>{k.label}</span>
          <strong className={styles.kpiValue}>
            <Fv>{k.value}</Fv>
          </strong>
          <span className={styles.kpiDelta}>{k.delta}</span>
        </article>
      ))}
    </div>
  );

  const renderColetaScreen = () => {
    const data = coleta as ColetaSessionData;
    switch (screen) {
      case 'dashboard':
        return (
          <DemoScreen screen={screen}>
            {renderKpiGrid(data.kpis)}
            {renderLineChart('Evolução de coletas', data.dashboardLine, data.lineDelta)}
            <div className={styles.dashboardGrid}>
              {renderBarChart('Coletas da semana', data.dashboardBars)}
              {renderProgressList('Volume por perfil de resíduo', data.dashboardPerfil)}
            </div>
            <div className={styles.dashboardGrid}>
              <div className={styles.panelCard}>
                <span className={styles.panelTitle}>Frota em operação</span>
                <ul className={styles.fleetList}>
                  {data.dashboardFrota.map((f, i) => (
                    <li key={f.veiculo} className={styles.fleetRow} style={{ '--stagger': i } as CSSProperties}>
                      <div className={styles.fleetHead}>
                        <strong>
                          <Fv>{f.veiculo}</Fv>
                        </strong>
                        <span className={`${styles.statusPill} ${statusClass(f.status)}`}>{f.status}</span>
                      </div>
                      <span className={styles.fleetDetail}>
                        <Fv>{f.detalhe}</Fv>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {renderEventList('Últimos eventos', data.dashboardEventos)}
            </div>
          </DemoScreen>
        );
      case 'programacao':
        return (
          <DemoScreen screen={screen}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Rota</th>
                    <th>Veículo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.programacao.map((row, i) => (
                    <tr key={row.id} className={styles.tableRow} style={{ '--stagger': i } as CSSProperties}>
                      <td className={styles.mono}>{row.hora}</td>
                      <td>
                        <Fv>{row.cliente}</Fv>
                      </td>
                      <td>
                        <Fv>{row.rota}</Fv>
                      </td>
                      <td>
                        <Fv>{row.caminhao}</Fv>
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${statusClass(row.status)}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.screenFooter}>
              {renderKpiGrid([
                {
                  label: 'Coletas do dia',
                  value: String(data.programacao.length),
                  delta: 'Na programação',
                },
                {
                  label: 'Em rota',
                  value: String(data.programacao.filter((r) => r.status === 'Em rota').length),
                  delta: 'Em andamento',
                },
                {
                  label: 'Agendadas',
                  value: String(data.programacao.filter((r) => r.status === 'Agendada').length),
                  delta: 'A executar',
                },
                {
                  label: 'Concluídas',
                  value: String(data.programacao.filter((r) => r.status === 'Concluída').length),
                  delta: 'Finalizadas',
                },
              ])}
              <div className={styles.dashboardGrid}>
                {renderProgressList(
                  'Por status',
                  countGrouped(data.programacao, (r) => r.status, ['Em rota', 'Agendada', 'Concluída']),
                )}
                {renderProgressList('Por rota', countGrouped(data.programacao, (r) => r.rota))}
              </div>
              <div className={styles.dashboardGrid}>
                {renderBarChart(
                  'Coletas por veículo',
                  countGrouped(data.programacao, (r) => r.caminhao).map(({ label, pct }) => ({
                    label: shortLabel(label, 12),
                    value: pct,
                  })),
                )}
                {renderEventList('Movimentações recentes', data.dashboardEventos.slice(0, 5))}
              </div>
            </div>
          </DemoScreen>
        );
      case 'mtr':
        return (
          <DemoScreen screen={screen}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Cliente</th>
                    <th>Etapa</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mtrs.map((row, i) => (
                    <tr key={row.id} className={styles.tableRow} style={{ '--stagger': i } as CSSProperties}>
                      <td className={styles.mono}>
                        <Fv>{row.documento}</Fv>
                      </td>
                      <td>
                        <Fv>{row.cliente}</Fv>
                      </td>
                      <td>{row.etapa}</td>
                      <td>
                        <span className={`${styles.statusPill} ${statusClass(row.status)}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.screenFooter}>
              {renderKpiGrid([
                { label: 'Documentos', value: String(data.mtrs.length), delta: 'Listados' },
                {
                  label: 'Em andamento',
                  value: String(data.mtrs.filter((r) => r.status === 'Em andamento').length),
                  delta: 'Operação ativa',
                },
                {
                  label: 'Emitidos',
                  value: String(data.mtrs.filter((r) => r.status === 'Emitido').length),
                  delta: 'Aguardando fluxo',
                },
                {
                  label: 'Finalizados',
                  value: String(data.mtrs.filter((r) => r.status === 'Finalizado').length),
                  delta: 'Encerrados',
                },
              ])}
              <div className={styles.dashboardGrid}>
                {renderProgressList(
                  'Por status',
                  countGrouped(data.mtrs, (r) => r.status, ['Em andamento', 'Emitido', 'Finalizado', 'Rascunho']),
                )}
                {renderProgressList('Por etapa', countGrouped(data.mtrs, (r) => r.etapa))}
              </div>
              <div className={styles.dashboardGrid}>
                {renderBarChart(
                  'Documentos por cliente',
                  countGrouped(data.mtrs, (r) => r.cliente).map(({ label, pct }) => ({
                    label: shortLabel(label, 14),
                    value: pct,
                  })),
                )}
                {renderEventList('Últimos eventos', data.dashboardEventos.slice(0, 5))}
              </div>
            </div>
          </DemoScreen>
        );
      case 'clientes':
        return (
          <DemoScreen screen={screen}>
            <div className={styles.cardGrid}>
              {data.clientes.map((c, i) => (
                <article
                  key={c.id}
                  className={styles.clientCard}
                  style={{ '--stagger': i } as CSSProperties}
                >
                  <div className={styles.clientCardHead}>
                    <span className={styles.clientIcon} aria-hidden>
                      <span className="material-symbols-outlined">{c.icon}</span>
                    </span>
                    <div className={styles.clientCardTitles}>
                      <h3 className={styles.clientCardTitle}>{c.segmento}</h3>
                      <span className={styles.clientCardSub}>Cliente ativo</span>
                    </div>
                    <span className={styles.clientBadge}>Ativo</span>
                  </div>
                  <dl className={styles.clientDl}>
                    <div>
                      <dt>Região</dt>
                      <dd>
                        <Fv>{c.regiao}</Fv>
                      </dd>
                    </div>
                    <div>
                      <dt>Periodicidade</dt>
                      <dd>
                        <Fv>{c.periodicidade}</Fv>
                      </dd>
                    </div>
                    <div>
                      <dt>Perfil de resíduo</dt>
                      <dd>
                        <Fv>{c.perfil}</Fv>
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            <div className={styles.screenFooter}>
              <div className={styles.dashboardGrid}>
                {renderProgressList('Por segmento', countGrouped(data.clientes, (c) => c.segmento))}
                {renderProgressList('Por periodicidade', countGrouped(data.clientes, (c) => c.periodicidade))}
              </div>
              <div className={styles.dashboardGrid}>
                {renderProgressList('Por perfil de resíduo', countGrouped(data.clientes, (c) => c.perfil))}
                {renderEventList('Atividade recente', data.dashboardEventos.slice(0, 5))}
              </div>
            </div>
          </DemoScreen>
        );
      default:
        return (
          <DemoScreen screen={screen}>
            <div className={styles.inicioLayout}>
              <div className={styles.hero}>
                <div className={styles.heroGlow} aria-hidden />
                <p className={styles.heroEyebrow}>Desenvolvido por NEXUS · Sua marca · Seu sistema</p>
                <h2 className={styles.heroTitle}>
                  Olá, <Fv>{operatorName}</Fv>
                </h2>
                <p className={styles.heroLead}>
                  Hoje há{' '}
                  <Fv>
                    <strong>{data.hero.coletasProgramadas} coletas programadas</strong>
                  </Fv>{' '}
                  e{' '}
                  <Fv>
                    <strong>{data.hero.mtrAberto} MTR em aberto</strong>
                  </Fv>{' '}
                  na operação de hoje.
                </p>
                <div className={styles.pipeline}>
                  {COLETA_PIPELINE.map((step, i) => (
                    <div
                      key={step.label}
                      className={styles.pipelineStep}
                      style={{ '--stagger': i } as CSSProperties}
                    >
                      <span className="material-symbols-outlined" aria-hidden>
                        {step.icon}
                      </span>
                      <span>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className={styles.heroActions}>
                  <button type="button" className={styles.primaryBtn} onClick={() => goTo('programacao')}>
                    Ver programação
                  </button>
                  <button type="button" className={styles.ghostBtn} onClick={() => goTo('dashboard')}>
                    Dashboard
                  </button>
                </div>
              </div>
              <aside className={styles.inicioAside}>
                {renderQuickStats(data.quickStats)}
                {renderEventList('Agora na operação', data.dashboardEventos.slice(0, 4))}
              </aside>
            </div>
            <div className={styles.inicioBottom}>
              <div className={styles.panelCard}>
                <span className={styles.panelTitle}>Próximas coletas</span>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Cliente</th>
                        <th>Rota</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.programacao.slice(0, 6).map((row, i) => (
                        <tr key={row.id} className={styles.tableRow} style={{ '--stagger': i } as CSSProperties}>
                          <td className={styles.mono}>{row.hora}</td>
                          <td>
                            <Fv>{row.cliente}</Fv>
                          </td>
                          <td>
                            <Fv>{row.rota}</Fv>
                          </td>
                          <td>
                            <span className={`${styles.statusPill} ${statusClass(row.status)}`}>{row.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={styles.panelCard}>
                <span className={styles.panelTitle}>Segmentos ativos</span>
                <ul className={styles.segmentList}>
                  {data.clientes.map((c, i) => (
                    <li key={c.id} className={styles.segmentRow} style={{ '--stagger': i } as CSSProperties}>
                      <span className={styles.segmentIcon} aria-hidden>
                        <span className="material-symbols-outlined">{c.icon}</span>
                      </span>
                      <div className={styles.segmentBody}>
                        <strong>{c.segmento}</strong>
                        <span>Cadastro ativo</span>
                      </div>
                      <span className={styles.clientBadge}>Ativo</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DemoScreen>
        );
    }
  };

  const renderAdegaScreen = () => {
    const data = bebidas as BebidasSessionData;
    switch (screen) {
      case 'dashboard':
        return (
          <DemoScreen screen={screen}>
            {renderKpiGrid(data.kpis)}
            <div className={styles.dashboardGrid}>
              {renderBarChart('Vendas da semana', data.dashboardBars)}
              {renderProgressList('Participação por canal', data.dashboardCanais)}
            </div>
            <div className={styles.dashboardGrid}>
              <div className={styles.panelCard}>
                <span className={styles.panelTitle}>Produtos em destaque</span>
                <ul className={styles.rankList}>
                  {data.dashboardDestaques.map((d, i) => (
                    <li key={d.produto} className={styles.rankRow} style={{ '--stagger': i } as CSSProperties}>
                      <span className={styles.rankPos}>{i + 1}</span>
                      <div className={styles.rankBody}>
                        <strong>
                          <Fv>{d.produto}</Fv>
                        </strong>
                        <span>
                          <Fv>{d.vendas}</Fv>
                        </span>
                      </div>
                      <span
                        className={`${styles.rankTrend} ${d.tendencia === 'Alta' ? styles.trendUp : d.tendencia === 'Baixa' ? styles.trendDown : ''}`}
                      >
                        {d.tendencia}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {renderEventList('Movimentações recentes', data.dashboardEventos)}
            </div>
          </DemoScreen>
        );
      case 'pdv':
        return (
          <DemoScreen screen={screen}>
            <div className={styles.pdvLayout}>
              <div className={styles.productGrid}>
                {data.produtos.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.productCard} ${popProductId === p.id ? styles.productCardPop : ''}`}
                    style={{ '--stagger': i } as CSSProperties}
                    onClick={() => addToCart(p.id)}
                  >
                    <span className={styles.productName}>
                      <Fv>{p.nome}</Fv>
                    </span>
                    <span className={styles.productPrice}>
                      <Fv>{formatBrl(p.preco)}</Fv>
                    </span>
                    <span className={styles.productHint}>
                      {(cart[p.id] ?? 0) > 0 ? `${cart[p.id]} no carrinho` : 'Toque para adicionar'}
                    </span>
                  </button>
                ))}
              </div>
              <aside className={`${styles.cartPanel} ${saleFlash ? styles.cartFlash : ''}`}>
                <h3 className={styles.cartTitle}>Carrinho</h3>
                <p className={styles.cartMeta}>
                  {cartCount} {cartCount === 1 ? 'item' : 'itens'} · <Fv>{formatBrl(cartTotal)}</Fv>
                </p>
                <ul className={styles.cartList}>
                  {data.produtos.filter((p) => (cart[p.id] ?? 0) > 0).map((p) => (
                    <li key={p.id} className={styles.cartLineEnter}>
                      <span>
                        <Fv>
                          {p.nome} · {cart[p.id]}x
                        </Fv>
                      </span>
                      <span>
                        <Fv>{formatBrl((cart[p.id] ?? 0) * p.preco)}</Fv>
                      </span>
                    </li>
                  ))}
                  {cartCount === 0 && <li className={styles.cartEmpty}>Nenhum item adicionado</li>}
                </ul>
                <div className={styles.cartTotal}>
                  <span>Total</span>
                  <strong>
                    <Fv>{formatBrl(cartTotal)}</Fv>
                  </strong>
                </div>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={cartCount === 0}
                  onClick={finishSale}
                >
                  {saleFlash ? 'Venda registrada' : 'Finalizar venda'}
                </button>
              </aside>
            </div>
          </DemoScreen>
        );
      case 'pedidos':
        return (
          <DemoScreen screen={screen}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Pedido</th>
                    <th>Canal</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.pedidos.map((row, i) => {
                    const status = pedidoStatuses[row.id] ?? row.status;
                    return (
                      <tr key={row.id} className={styles.tableRow} style={{ '--stagger': i } as CSSProperties}>
                        <td className={styles.mono}>{row.hora}</td>
                        <td className={styles.mono}>
                          <Fv>{row.pedido}</Fv>
                        </td>
                        <td>
                          <span className={styles.channelTag}>{row.canal}</span>
                        </td>
                        <td>
                          <Fv>{row.cliente}</Fv>
                        </td>
                        <td>
                          <Fv>{row.total}</Fv>
                        </td>
                        <td>
                          <span className={`${styles.statusPill} ${statusClass(status)}`}>{status}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.rowAction}
                            onClick={() => advancePedido(row.id, row.status)}
                            disabled={status === 'Entregue'}
                          >
                            Avançar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {(() => {
              const pedidoRows = data.pedidos.map((row) => ({
                ...row,
                status: pedidoStatuses[row.id] ?? row.status,
              }));
              const volumeTurno = pedidoRows.reduce((sum, row) => sum + parseBrl(row.total), 0);
              return (
                <div className={styles.screenFooter}>
                  {renderKpiGrid([
                    {
                      label: 'Na fila',
                      value: String(pedidoRows.filter((r) => r.status === 'Na fila').length),
                      delta: 'Aguardando',
                    },
                    {
                      label: 'Em preparo',
                      value: String(pedidoRows.filter((r) => r.status === 'Separando').length),
                      delta: 'Separando',
                    },
                    {
                      label: 'Prontos',
                      value: String(pedidoRows.filter((r) => r.status === 'Pronto').length),
                      delta: 'Para retirada',
                    },
                    {
                      label: 'Volume listado',
                      value: formatBrl(volumeTurno),
                      delta: `${pedidoRows.length} pedidos`,
                    },
                  ])}
                  <div className={styles.dashboardGrid}>
                    {renderProgressList(
                      'Fila por status',
                      countGrouped(pedidoRows, (r) => r.status, ['Na fila', 'Separando', 'Pronto', 'Entregue']),
                    )}
                    {renderProgressList('Pedidos por canal', countGrouped(pedidoRows, (r) => r.canal))}
                  </div>
                  <div className={styles.dashboardGrid}>
                    {renderBarChart('Pedidos por horário', buildHourBars(pedidoRows))}
                    {renderEventList('Movimentações recentes', data.dashboardEventos.slice(0, 5))}
                  </div>
                </div>
              );
            })()}
          </DemoScreen>
        );
      case 'estoque':
        return (
          <DemoScreen screen={screen}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Produto</th>
                    <th>Saldo</th>
                    <th>Mínimo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.estoque.map((row, i) => (
                    <tr key={row.id} className={styles.tableRow} style={{ '--stagger': i } as CSSProperties}>
                      <td className={styles.mono}>
                        <Fv>{row.sku}</Fv>
                      </td>
                      <td>
                        <Fv>{row.produto}</Fv>
                      </td>
                      <td>
                        <Fv>{row.saldo}</Fv>
                      </td>
                      <td>
                        <Fv>{row.minimo}</Fv>
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${statusClass(row.status)}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.screenFooter}>
              {renderKpiGrid([
                { label: 'SKUs', value: String(data.estoque.length), delta: 'Cadastrados' },
                {
                  label: 'Em nível',
                  value: String(data.estoque.filter((r) => r.status === 'OK').length),
                  delta: 'Estoque OK',
                },
                {
                  label: 'Reposição',
                  value: String(data.estoque.filter((r) => r.status === 'Baixo').length),
                  delta: 'Abaixo do mínimo',
                },
                {
                  label: 'Cobertura média',
                  value: `${Math.round(data.estoque.reduce((s, r) => s + r.pct, 0) / Math.max(data.estoque.length, 1))}%`,
                  delta: 'Do mínimo',
                },
              ])}
              <div className={styles.dashboardGrid}>
                <div className={styles.panelCard}>
                  <span className={styles.panelTitle}>Itens para reposição</span>
                  <ul className={styles.rankList}>
                    {data.estoque
                      .filter((r) => r.status === 'Baixo')
                      .map((r, i) => (
                        <li key={r.id} className={styles.rankRow} style={{ '--stagger': i } as CSSProperties}>
                          <span className={styles.rankPos}>!</span>
                          <div className={styles.rankBody}>
                            <strong>
                              <Fv>{r.produto}</Fv>
                            </strong>
                            <span>
                              <Fv>
                                {r.saldo} · mín. {r.minimo}
                              </Fv>
                            </span>
                          </div>
                          <span className={`${styles.rankTrend} ${styles.trendDown}`}>{r.pct}%</span>
                        </li>
                      ))}
                    {data.estoque.every((r) => r.status !== 'Baixo') && (
                      <li className={styles.cartEmpty}>Nenhum item abaixo do mínimo</li>
                    )}
                  </ul>
                </div>
                {renderBarChart(
                  'Nível de estoque',
                  data.estoque.map((r) => ({
                    label: shortLabel(r.produto, 10),
                    value: r.pct,
                  })),
                )}
              </div>
              <div className={styles.dashboardGrid}>
                {renderProgressList('Por status', countGrouped(data.estoque, (r) => r.status, ['OK', 'Baixo']))}
                {renderEventList('Movimentações de estoque', data.dashboardEventos.slice(0, 5))}
              </div>
            </div>
          </DemoScreen>
        );
      default:
        return (
          <DemoScreen screen={screen}>
            <div className={styles.inicioLayout}>
              <div className={styles.hero}>
                <div className={styles.heroGlow} aria-hidden />
                <p className={styles.heroEyebrow}>Desenvolvido por NEXUS · Sua marca · Seu sistema</p>
                <h2 className={styles.heroTitle}>
                  Olá, <Fv>{operatorName}</Fv>
                </h2>
                <p className={styles.heroLead}>
                  Hoje há{' '}
                  <Fv>
                    <strong>{data.hero.pedidosHoje} pedidos</strong>
                  </Fv>{' '}
                  e{' '}
                  <Fv>
                    <strong>{data.hero.alertasEstoque} alertas de estoque</strong>
                  </Fv>{' '}
                  na operação de bebidas.
                </p>
                <div className={styles.pipeline}>
                  {ADEGA_PIPELINE.map((step, i) => (
                    <div
                      key={step.label}
                      className={styles.pipelineStep}
                      style={{ '--stagger': i } as CSSProperties}
                    >
                      <span className="material-symbols-outlined" aria-hidden>
                        {step.icon}
                      </span>
                      <span>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className={styles.channelGrid}>
                  {ADEGA_CANAIS.map((ch, i) => (
                    <div
                      key={`${ch.label}-${i}`}
                      className={styles.channelCard}
                      style={{ '--stagger': i } as CSSProperties}
                    >
                      <span className="material-symbols-outlined" aria-hidden>
                        {ch.icon}
                      </span>
                      <span>{ch.label}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.heroActions}>
                  <button type="button" className={styles.primaryBtn} onClick={() => goTo('pedidos')}>
                    Ver pedidos
                  </button>
                  <button type="button" className={styles.ghostBtn} onClick={() => goTo('dashboard')}>
                    Dashboard
                  </button>
                  <button type="button" className={styles.ghostBtn} onClick={() => goTo('pdv')}>
                    Abrir PDV
                  </button>
                </div>
              </div>
              <aside className={styles.inicioAside}>
                {renderQuickStats(data.quickStats)}
                {renderEventList('Movimentações recentes', data.dashboardEventos.slice(0, 4))}
              </aside>
            </div>
            <div className={styles.inicioBottom}>
              <div className={styles.panelCard}>
                <span className={styles.panelTitle}>Pedidos recentes</span>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pedidos.slice(0, 6).map((row, i) => (
                        <tr key={row.id} className={styles.tableRow} style={{ '--stagger': i } as CSSProperties}>
                          <td className={styles.mono}>{row.hora}</td>
                          <td className={styles.mono}>
                            <Fv>{row.pedido}</Fv>
                          </td>
                          <td>
                            <Fv>{row.cliente}</Fv>
                          </td>
                          <td>
                            <span
                              className={`${styles.statusPill} ${statusClass(pedidoStatuses[row.id] ?? row.status)}`}
                            >
                              {pedidoStatuses[row.id] ?? row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={styles.panelCard}>
                <span className={styles.panelTitle}>Mais vendidos hoje</span>
                <ul className={styles.rankList}>
                  {data.dashboardDestaques.map((d, i) => (
                    <li key={d.produto} className={styles.rankRow} style={{ '--stagger': i } as CSSProperties}>
                      <span className={styles.rankPos}>{i + 1}</span>
                      <div className={styles.rankBody}>
                        <strong>
                          <Fv>{d.produto}</Fv>
                        </strong>
                        <span>
                          <Fv>{d.vendas}</Fv>
                        </span>
                      </div>
                      <span
                        className={`${styles.rankTrend} ${d.tendencia === 'Alta' ? styles.trendUp : d.tendencia === 'Baixa' ? styles.trendDown : ''}`}
                      >
                        {d.tendencia}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DemoScreen>
        );
    }
  };

  const screenTitle = demo.nav.find((n) => n.id === screen)?.label ?? 'Início';
  return (
    <div
      className={styles.shell}
      style={
        {
          '--demo-accent': demo.accent,
          '--demo-accent-soft': demo.accentSoft,
        } as CSSProperties
      }
    >
      <div className={styles.demoBanner}>
        <span className={styles.bannerPulse} />
        <span>{DEMO_BANNER}</span>
        <Link to="/sistemas" className={styles.backLink}>
          ← Voltar ao Hub
        </Link>
      </div>

      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden />
          <div>
            <strong className={styles.brandName}>{demo.brandName}</strong>
            <span className={styles.brandTagline}>{demo.tagline}</span>
          </div>
        </div>
        <div className={styles.userChip}>
          <span className="material-symbols-outlined" aria-hidden>
            account_circle
          </span>
          <Fv>{operatorName}</Fv>
        </div>
      </header>

      <div className={styles.body}>
        <nav className={styles.sidebar} aria-label="Menu da demonstração">
          {demo.nav.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.navItem} ${screen === item.id ? styles.navItemActive : ''}`}
              onClick={() => goTo(item.id)}
            >
              <span className="material-symbols-outlined" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <main className={styles.main}>
          <h1 className={styles.screenTitle}>{screenTitle}</h1>
          {demoId === 'coleta' ? renderColetaScreen() : renderAdegaScreen()}
        </main>
      </div>

      <SistemaDemoChat demoId={demoId} />
    </div>
  );
}
