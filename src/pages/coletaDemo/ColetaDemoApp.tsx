import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DEMO_BANNER } from '../../data/sistemaDemoCatalog';
import { useDemoSessionData, buildColetaDashboardForPeriod, type ColetaDashboardPeriod, type ColetaSessionData } from '../../data/sistemaDemoRandomize';
import { SistemaDemoChat } from '../../components/SistemaDemoChat';
import {
  COLETA_MENU_GROUPS,
  COLETA_SCREEN_TITLES,
  isColetaMenuBranch,
  type ColetaDemoScreen,
} from './coletaDemoNav';
import styles from './ColetaDemo.module.css';

function Fv({ children }: { children: ReactNode }) {
  return (
    <span className={styles.ficticioWrap}>
      {children}
      <span className={styles.ficticioMark}>fictício</span>
    </span>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s.includes('conclu') || s.includes('finaliz') || s.includes('dispon') || s.includes('ativo')) {
    return styles.pillOk;
  }
  if (s.includes('rota') || s.includes('andamento') || s.includes('emitido') || s.includes('separ')) {
    return styles.pillWarn;
  }
  return styles.pillMuted;
}

export function ColetaDemoApp() {
  const location = useLocation();
  const data = useDemoSessionData('coleta', location.key) as ColetaSessionData;
  const [screen, setScreen] = useState<ColetaDemoScreen>('inicio');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(COLETA_MENU_GROUPS.map((g) => [g.title, true])),
  );
  const [period, setPeriod] = useState<ColetaDashboardPeriod>('30d');
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const [nowLabel, setNowLabel] = useState('');

  useEffect(() => {
    setScreen('inicio');
  }, [location.key]);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowLabel(
        d.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const operatorName = data.operatorName;
  const pageTitle = COLETA_SCREEN_TITLES[screen];

  const dashboard = useMemo(
    () => buildColetaDashboardForPeriod(`${location.key}::${dashboardRefresh}`, period),
    [location.key, period, dashboardRefresh],
  );

  const linePath = useMemo(() => {
    const pts = dashboard.dashboardLine;
    const max = Math.max(...pts.map((p) => p.value));
    const min = Math.min(...pts.map((p) => p.value));
    const range = max - min || 1;
    const w = 100;
    const h = 44;
    return pts
      .map((p, i) => {
        const x = (i / Math.max(pts.length - 1, 1)) * w;
        const y = h - ((p.value - min) / range) * (h - 8) - 4;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [dashboard.dashboardLine]);

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const renderTableActions = () => (
    <div className={styles.actions}>
      <button type="button" className={styles.btnEdit}>
        Editar
      </button>
      <button type="button" className={styles.btnDel}>
        Excluir
      </button>
    </div>
  );

  const renderWelcome = () => (
    <div className={styles.welcome}>
      <div className={styles.welcomeCard}>
        <h1 className={styles.welcomeTitle}>
          Bem-vindo, <Fv>{operatorName}</Fv>
        </h1>
        <p className={styles.welcomeLead}>
          Centralização de dados, padronização do fluxo e automação de processos.
        </p>
        <button type="button" className={styles.welcomeBtn} onClick={() => setScreen('dashboard')}>
          Confira as novidades!
        </button>
        <p className={styles.welcomeHint}>
          Utilize o menu lateral para navegar nas áreas disponíveis para o seu perfil.
        </p>
        <p className={styles.welcomeVersion}>Versão do sistema: R1.2.334 · BY NEXUS</p>
      </div>
    </div>
  );

  const renderDashboard = () => {
    const m = dashboard.metrics;
    const periods: [ColetaDashboardPeriod, string][] = [
      ['today', 'HOJE'],
      ['yday', 'ONTEM'],
      ['7d', '7 DIAS'],
      ['15d', '15 DIAS'],
      ['30d', '30 DIAS'],
      ['month', 'ESTE MÊS'],
      ['lastmonth', 'MÊS PASSADO'],
      ['year', 'ESTE ANO'],
    ];

    return (
      <div key={period} className={styles.dashboardRefresh}>
        <div className={styles.pageHead}>
          <div>
            <p className={styles.pageEyebrow}>Painel do cliente</p>
            <h1 className={styles.pageH1}>Relatório Gerencial</h1>
            <p className={styles.pageDesc}>Período: {dashboard.periodTitle}</p>
          </div>
          <div className={styles.toolbar}>
            <button type="button" className={styles.btnOutline}>
              Análise de dados
            </button>
            <button type="button" className={styles.btnReport}>
              Imprimir relatório
            </button>
            <button type="button" className={styles.btnPrimary} onClick={() => setDashboardRefresh((n) => n + 1)}>
              Atualizar painel
            </button>
          </div>
        </div>

        <div className={styles.periodRow}>
          {periods.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`${styles.periodPill} ${period === id ? styles.periodPillActive : ''}`}
              onClick={() => setPeriod(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.filterRow}>
          <span className={styles.selectFake}>Todas as Unidades</span>
          <span className={styles.selectFake}>Todos os Grupos</span>
          <span className={styles.selectFake}>Todos os Estados / Cidades</span>
        </div>

        <div className={styles.kpiGridHero}>
          {[
            ['Total faturado', m.totalFaturado],
            ['Total de pedidos', String(m.totalPedidos)],
            ['Total cancelado', m.totalCancelado],
            ['Total de custos', m.totalCustos, true],
          ].map(([label, value, alert], i) => (
            <div
              key={i}
              className={`${styles.kpiCard} ${alert ? styles.kpiCardAlert : ''}`}
            >
              <div className={styles.kpiLabel}>{label}</div>
              <div className={styles.kpiValue}>
                <Fv>{value}</Fv>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.kpiGridMid}>
          {[
            ['Resíduos kg', m.residuosKg],
            ['Volume m³', m.volumeM3],
            ['Total de coletas', m.totalColetas],
            ['Coletas concluídas', m.coletasConcluidas],
            ['Coletas pendentes', m.coletasPendentes],
            ['Coletas canceladas', m.coletasCanceladas],
          ].map(([label, value]) => (
            <div key={label} className={styles.kpiCard}>
              <div className={styles.kpiLabel}>{label}</div>
              <div className={`${styles.kpiValue} ${styles.kpiValueSm}`}>
                <Fv>{value}</Fv>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.kpiGridBot}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Total de clientes</div>
            <div className={styles.kpiValue}>
              <Fv>{m.totalClientes}</Fv>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Total de km rodados</div>
            <div className={styles.kpiValue}>
              <Fv>{m.kmRodados}</Fv>
            </div>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Status das Coletas</h2>
            <button type="button" className={styles.btnOutline}>
              Abrir relatório de status
            </button>
          </div>
          <div className={styles.statusGrid}>
            {[
              ['Coletas agendadas', m.agendadas],
              ['Coletas em rota', m.emRota],
              ['Coletas atrasadas > 1 hora', m.atrasadas],
              ['Coletas finalizadas', m.finalizadasHoje],
            ].map(([label, value]) => (
              <div key={label} className={styles.statusBox}>
                <strong>
                  <Fv>{value}</Fv>
                </strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartRow}>
          <div className={styles.chartBox}>
            <div className={styles.chartTitle}>
              Evolução de coletas · <Fv>{dashboard.lineDelta}</Fv>
            </div>
            <svg viewBox="0 0 100 48" className={styles.lineSvg} preserveAspectRatio="none">
              <path d={linePath} fill="none" stroke="#0d9488" strokeWidth="1.5" />
            </svg>
          </div>
          <div className={styles.chartBox}>
            <div className={styles.chartTitle}>Coletas por período</div>
            <div className={styles.barRow}>
              {dashboard.dashboardBars.map((b) => {
                const max = Math.max(...dashboard.dashboardBars.map((x) => x.value), 1);
                return (
                  <div key={b.label} className={styles.barCol}>
                    <div
                      className={styles.bar}
                      style={{ height: `${Math.round((b.value / max) * 100)}%` } as CSSProperties}
                    />
                    <span className={styles.barLabel}>{b.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.rankRow3}>
          {dashboard.dashboardPerfil.map((item) => (
            <div key={item.label} className={styles.sectionCard}>
              <strong>{item.label}</strong>
              <div className={styles.rankBar}>
                <div className={styles.rankBarFill} style={{ width: `${item.pct}%` }} />
              </div>
              <span className={styles.kpiLabel}>
                <Fv>{item.pct}%</Fv>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProgramacao = () => {
    const m = data.metrics;
    return (
      <>
        <div className={styles.pageHead}>
          <div>
            <p className={styles.pageEyebrow}>Programação</p>
            <h1 className={styles.pageH1}>Calendário das programações de Coleta</h1>
            <p className={styles.pageDesc}>
              Fluxo demonstrativo: programação → MTR → controle de massa. Dados ilustrativos para portfólio NEXUS.
            </p>
          </div>
          <div className={styles.toolbar}>
            <button type="button" className={styles.btnOutline}>
              Atualizar
            </button>
            <button type="button" className={styles.btnPrimary}>
              + Nova programação
            </button>
            <button type="button" className={styles.btnReport}>
              Relatório (PDF)
            </button>
          </div>
        </div>

        <div className={styles.summaryCards}>
          {[
            ['Mês selecionado', 'Julho de 2026'],
            ['Total de programações', String(m.programacoesMes)],
            ['Coletas fixas', String(m.coletasFixas)],
            ['Com MTR (fluxo)', String(m.comMtr)],
            ['Aguardando MTR', String(m.aguardandoMtr)],
          ].map(([label, value]) => (
            <div key={label} className={styles.summaryCard}>
              <span>{label}</span>
              <strong>
                <Fv>{value}</Fv>
              </strong>
            </div>
          ))}
        </div>

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
              {data.programacao.map((row) => (
                <tr key={row.id}>
                  <td>{row.hora}</td>
                  <td className={styles.tdStrong}>
                    <Fv>{row.cliente}</Fv>
                  </td>
                  <td>
                    <Fv>{row.rota}</Fv>
                  </td>
                  <td>
                    <Fv>{row.caminhao}</Fv>
                  </td>
                  <td>
                    <span className={`${styles.statusPill} ${statusPill(row.status)}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderMtr = () => (
    <>
      <div className={styles.pageHead}>
        <div>
          <p className={styles.pageEyebrow}>Fluxo operacional</p>
          <h1 className={styles.pageH1}>MTR</h1>
          <p className={styles.pageDesc}>Manifesto de Transporte de Resíduos — listagem demonstrativa.</p>
        </div>
        <div className={styles.toolbar}>
          <button type="button" className={styles.btnReport}>Relatório (PDF)</button>
          <button type="button" className={styles.btnPrimary}>+ Novo MTR</button>
        </div>
      </div>
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
            {data.mtrs.map((row) => (
              <tr key={row.id}>
                <td className={styles.tdMono}>
                  <Fv>{row.documento}</Fv>
                </td>
                <td className={styles.tdStrong}>
                  <Fv>{row.cliente}</Fv>
                </td>
                <td>{row.etapa}</td>
                <td>
                  <span className={`${styles.statusPill} ${statusPill(row.status)}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderMotoristas = () => (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageH1}>Motoristas e documentação (CNH)</h1>
          <p className={styles.pageDesc}>
            Cadastro base de motoristas e CNH. Integração com logística nas próximas fases.
          </p>
        </div>
        <div className={styles.toolbar}>
          <span className={styles.rgKpiInline}>
            Total de motoristas: <strong><Fv>{data.motoristas.length}</Fv></strong>
          </span>
          <button type="button" className={styles.btnReport}>Relatório (PDF)</button>
          <button type="button" className={styles.btnPrimary}>Novo motorista</button>
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Nº CNH</th>
              <th>Categoria</th>
              <th>Validade CNH</th>
              <th>MOPP</th>
              <th>Val. MOPP</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.motoristas.map((row) => (
              <tr key={row.id}>
                <td className={styles.tdStrong}>
                  <Fv>{row.nome}</Fv>
                </td>
                <td>{row.cpf}</td>
                <td>{row.cnh}</td>
                <td>{row.categoria}</td>
                <td>{row.validadeCnh}</td>
                <td>{row.mopp}</td>
                <td>{row.valMopp}</td>
                <td>{renderTableActions()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderVeiculos = () => (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageH1}>Veículos</h1>
          <p className={styles.pageDesc}>Cadastro da frota e disponibilidade.</p>
        </div>
        <div className={styles.toolbar}>
          <span className={styles.rgKpiInline}>
            Total de veículos: <strong><Fv>{data.veiculos.length}</Fv></strong>
          </span>
          <button type="button" className={styles.btnPrimary}>Novo veículo</button>
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Motorista</th>
              <th>Modelo</th>
              <th>Tara</th>
              <th>P. bruto</th>
              <th>CMT</th>
              <th>Disponibilidade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.veiculos.map((row) => (
              <tr key={row.id}>
                <td className={styles.tdMono}>
                  <Fv>{row.placa}</Fv>
                </td>
                <td>{row.motorista}</td>
                <td>{row.modelo}</td>
                <td>{row.tara}</td>
                <td>{row.bruto}</td>
                <td>{row.cmt}</td>
                <td>
                  <span className={`${styles.statusPill} ${statusPill(row.disponibilidade)}`}>
                    {row.disponibilidade}
                  </span>
                </td>
                <td>{renderTableActions()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderRepresentantes = () => (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageH1}>Representantes comerciais</h1>
          <p className={styles.pageDesc}>Cadastro dos representantes comerciais.</p>
        </div>
        <div className={styles.toolbar}>
          <span className={styles.rgKpiInline}>
            Total: <strong><Fv>{data.representantes.length}</Fv></strong>
          </span>
          <button type="button" className={styles.btnPrimary}>Novo representante</button>
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>CPF</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.representantes.map((row) => (
              <tr key={row.id}>
                <td className={styles.tdStrong}>
                  <Fv>{row.nome}</Fv>
                </td>
                <td>{row.email}</td>
                <td>
                  <Fv>{row.telefone}</Fv>
                </td>
                <td>{row.cpf}</td>
                <td>{renderTableActions()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderClientes = () => (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageH1}>Gerenciador</h1>
          <p className={styles.pageDesc}>Campos equivalentes ao cadastro de clientes — dados demonstrativos.</p>
        </div>
        <button type="button" className={styles.btnPrimary}>Novo gerenciador</button>
      </div>
      <div className={styles.sectionCard}>
        <div className={styles.filterRow}>
          {['Nome fantasia', 'Razão social', 'CNPJ / CPF', 'Status'].map((l) => (
            <span key={l} className={styles.selectFake}>
              {l}: -
            </span>
          ))}
        </div>
        <p className={styles.pageDesc}>
          Segmentos cadastrados na demonstração:{' '}
          {data.clientes.map((c) => c.segmento).join(', ')}. Regiões e perfis variam a cada entrada.
        </p>
      </div>
    </>
  );

  const renderPreview = () => (
    <div className={styles.previewBox}>
      <h2 className={styles.pageH1}>Módulo demonstrativo</h2>
      <p>Esta área existe no sistema completo. Na demonstração do portfólio, use as telas principais do menu.</p>
      <button type="button" className={styles.btnPrimary} onClick={() => setScreen('dashboard')}>
        Ir para o Dashboard
      </button>
    </div>
  );

  const renderScreen = () => {
    switch (screen) {
      case 'inicio':
        return renderWelcome();
      case 'dashboard':
        return renderDashboard();
      case 'programacao':
        return renderProgramacao();
      case 'mtr':
        return renderMtr();
      case 'motoristas':
        return renderMotoristas();
      case 'veiculos':
        return renderVeiculos();
      case 'representantes':
        return renderRepresentantes();
      case 'clientes':
        return renderClientes();
      default:
        return renderPreview();
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.demoBanner}>
        <span>{DEMO_BANNER}</span>
        <Link to="/sistemas">← Voltar ao Hub</Link>
      </div>

      <div className={styles.layoutRoot}>
        <aside className={styles.sidebar}>
          <nav className={styles.navWrap} aria-label="Menu principal">
            {COLETA_MENU_GROUPS.map((group) => (
              <div key={group.title} className={styles.navGroup}>
                <button
                  type="button"
                  className={styles.navGroupToggle}
                  onClick={() => toggleGroup(group.title)}
                >
                  <span className={styles.navGroupBar} />
                  {group.title}
                  <span className={styles.navGroupChevron}>{openGroups[group.title] ? '▾' : '▸'}</span>
                </button>
                {openGroups[group.title] &&
                  group.items.map((item) =>
                    isColetaMenuBranch(item) ? (
                      <div key={item.label}>
                        <div className={`${styles.navLink} ${styles.navLinkNested}`} style={{ cursor: 'default', opacity: 0.85 }}>
                          {item.label}
                        </div>
                        {item.children.map((child) => (
                          <button
                            key={child.label}
                            type="button"
                            className={`${styles.navLink} ${styles.navLinkNested} ${screen === child.id ? styles.navLinkActive : ''}`}
                            onClick={() => setScreen(child.id)}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        key={item.label}
                        type="button"
                        className={`${styles.navLink} ${screen === item.id ? styles.navLinkActive : ''}`}
                        onClick={() => setScreen(item.id)}
                      >
                        {item.label}
                      </button>
                    ),
                  )}
              </div>
            ))}
          </nav>
          <div className={styles.sidebarFooter}>
            <button type="button">Solicitar ajuste no sistema</button>
            R1.2.334
          </div>
        </aside>

        <div className={styles.mainCol}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.breadcrumb}>
                Início / {pageTitle}
              </div>
              <h1 className={styles.pageTitle}>{pageTitle}</h1>
            </div>
            <div className={styles.searchWrap}>
              <input
                className={styles.searchInput}
                placeholder="Cliente, número MTR ou ticket..."
                readOnly
                aria-label="Busca global"
              />
            </div>
            <div className={styles.headerRight}>
              <span className={styles.pillOnline}>Online</span>
              <span className={styles.datetime}>{nowLabel}</span>
              <div className={styles.userBlock}>
                <span className={styles.userName}>
                  <Fv>{operatorName}</Fv>
                </span>
                <span className={styles.userRole}>Operacional</span>
              </div>
              <div className={styles.avatar}>{initials(operatorName)}</div>
              <Link to="/sistemas" className={styles.btnSair}>
                Sair
              </Link>
            </div>
          </header>

          <main className={styles.mainScroll}>
            <div className={styles.pageShell}>
              <div className={styles.screenEnter}>{renderScreen()}</div>
            </div>
          </main>
        </div>
      </div>

      <SistemaDemoChat demoId="coleta" />
    </div>
  );
}
