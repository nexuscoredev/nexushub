import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { DEMO_BANNER } from '../../data/sistemaDemoCatalog';
import { SistemaDemoChat } from '../../components/SistemaDemoChat';
import {
  APPS_SISTEMA_DEMO,
  dataAtualFormatada,
  DEMO_MENU_ITEM_INICIAL,
  DEMO_MARCA,
  DEMO_USER_CARGO,
  DEMO_USER_NAME,
  DEMO_VERSION,
  HUB_ADMIN_MODULOS,
  HUB_NAV_ITEMS,
  menuItemKey,
  saudacaoPorHorario,
  temaApp,
  WELCOME_CTA,
  WELCOME_META_DIA,
  WELCOME_SHORTCUTS,
  WELCOME_SUGGESTIONS,
  resolveMenuItem,
  type LigeirinhoDemoApp,
} from './ligeirinhoDemoData';
import './ligeirinhoHubDemo.css';
import { LigeirinhoDemoModuleView } from './LigeirinhoDemoModuleView';

function HubAvatar({ nome, size = 'sm' }: { nome: string; size?: 'sm' }) {
  const iniciais = nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div className={`hub-avatar hub-avatar--${size}`} aria-hidden>
      <span className="hub-avatar__iniciais">{iniciais}</span>
    </div>
  );
}

function AtalhoTile({
  titulo,
  icone,
  onClick,
}: {
  titulo: string;
  icone: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="recepcao-atalho-tile" onClick={onClick}>
      <span className="recepcao-atalho-tile__icone-wrap" aria-hidden>
        <span className="recepcao-atalho-tile__icone">{icone}</span>
      </span>
      <span className="recepcao-atalho-tile__titulo">{titulo}</span>
      <span className="recepcao-atalho-tile__chevron" aria-hidden>
        ›
      </span>
    </button>
  );
}

function DemoAppMenuGroup({
  app,
  aberto,
  activeItem,
  onToggle,
  onSelectItem,
}: {
  app: LigeirinhoDemoApp;
  aberto: boolean;
  activeItem: string;
  onToggle: () => void;
  onSelectItem: (key: string) => void;
}) {
  return (
    <li className="app-menu-grupo">
      <div
        className={`app-menu-details${aberto ? ' app-menu-details--aberto' : ''}`}
        style={temaApp(app)}
      >
        <div className="app-menu-summary">
          <button type="button" className="app-menu-pill" onClick={onToggle}>
            <span className="app-menu-pill-icone-wrap">
              <span className="app-menu-pill-icone" aria-hidden>
                {app.icone}
              </span>
              {app.iconeLabel ? <span className="app-menu-pill-badge">{app.iconeLabel}</span> : null}
            </span>
            <span className="app-menu-pill-texto">{app.nome}</span>
          </button>
          <button type="button" className="app-menu-chevron" aria-label={`Expandir ${app.nome}`} onClick={onToggle} />
        </div>
        {aberto ? (
          <div className="app-menu-filhos-wrap">
            <div className="app-menu-filhos-lista">
              {app.grupos.map((grupo) => (
                <div key={grupo.titulo} className="app-menu-secao-interna app-menu-secao-interna--aberta">
                  <p className="app-menu-secao-interna-titulo app-menu-secao-interna-titulo--estatico">
                    {grupo.titulo}
                    <span className="app-menu-secao-chevron" aria-hidden />
                  </p>
                  <div className="app-menu-secao-filhos-wrap">
                    <ul className="app-menu-filhos app-menu-filhos--secao">
                      {grupo.itens.map((item) => {
                        const key = menuItemKey(app.id, grupo.titulo, item.id);
                        return (
                          <li key={key} className="app-menu-tela">
                            <button
                              type="button"
                              className={`app-menu-filho${activeItem === key ? ' ativo' : ''}`}
                              onClick={() => onSelectItem(key)}
                            >
                              <span className="app-menu-filho-icone" aria-hidden>
                                {item.icone}
                              </span>
                              <span className="app-menu-filho-titulo">{item.titulo}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function AppLauncherCard({
  app,
  staggerIndex = 0,
  onOpen,
}: {
  app: LigeirinhoDemoApp;
  staggerIndex?: number;
  onOpen?: () => void;
}) {
  return (
    <button
      type="button"
      className="app-launcher-tile"
      style={
        {
          ...temaApp(app),
          '--app-stagger': `${staggerIndex * 45}ms`,
        } as CSSProperties
      }
      aria-label={`Abrir ${app.nome}`}
      onClick={onOpen}
    >
      <span className="app-launcher-tile__mesh" aria-hidden />
      <span className="app-launcher-tile__glow" aria-hidden />
      <span className="app-launcher-tile__icon-wrap">
        <span className="app-launcher-tile__icon" aria-hidden>
          {app.icone}
        </span>
        {app.iconeLabel ? <span className="app-launcher-tile__badge">{app.iconeLabel}</span> : null}
      </span>
      <span className="app-launcher-tile__nome">{app.nome}</span>
    </button>
  );
}

export function LigeirinhoDemoApp() {
  const [activeNav, setActiveNav] = useState<'bem-vindo' | 'dashboard'>('bem-vindo');
  const [mainView, setMainView] = useState<'hub' | 'module'>('module');
  const [appExpandidoId, setAppExpandidoId] = useState('operacional');
  const [activeMenuItem, setActiveMenuItem] = useState(DEMO_MENU_ITEM_INICIAL);
  const welcomeDate = useMemo(() => dataAtualFormatada(), []);
  const greeting = useMemo(() => saudacaoPorHorario(), []);
  const primeiroNome = DEMO_USER_NAME;
  const moduleSelection = useMemo(() => resolveMenuItem(activeMenuItem), [activeMenuItem]);

  const openModule = (key: string) => {
    setActiveMenuItem(key);
    setAppExpandidoId(key.split(':')[0] ?? '');
    setMainView('module');
  };

  const openAppEntrada = (appId: string) => {
    const app = APPS_SISTEMA_DEMO.find((a) => a.id === appId);
    const primeiro = app?.grupos[0]?.itens[0];
    if (app && primeiro) {
      openModule(menuItemKey(app.id, app.grupos[0].titulo, primeiro.id));
    }
  };

  const renderTopbarAvatar = () => (
    <details className="hub-topbar-dropdown">
      <summary className="hub-topbar-dropdown__trigger" aria-label="Menu do usuário">
        <span className="hub-topbar-dropdown__pill">
          <span className="hub-topbar-dropdown__avatar-wrap">
            <HubAvatar nome={DEMO_USER_NAME} />
            <span className="hub-topbar-dropdown__chevron" aria-hidden />
          </span>
        </span>
      </summary>
    </details>
  );

  const renderWelcome = () => (
    <div className="hub-page hub-page--recepcao hub-page--denso recepcao--cargo-dev">
      <section className="recepcao-hero" aria-label="Boas-vindas">
        <div className="recepcao-hero__topo">
          <div className="recepcao-hero__identidade">
            <HubAvatar nome={DEMO_USER_NAME} />
            <div className="recepcao-hero__texto">
              <div className="recepcao-hero__meta">
                <time className="recepcao-hero__data" dateTime={new Date().toISOString()}>
                  {welcomeDate}
                </time>
              </div>
              <h1 className="recepcao-hero__saudacao">
                {greeting}, <span>{primeiroNome}</span>
              </h1>
              <p className="recepcao-hero__cargo">
                <span className="recepcao-cargo-badge" aria-hidden>
                  💻
                </span>
                {DEMO_USER_CARGO}
              </p>
              <p className="recepcao-hero__dica">{WELCOME_META_DIA}</p>
            </div>
          </div>
        </div>
        <div className="recepcao-hero__acoes">
          <button
            type="button"
            className="recepcao-cta"
            onClick={() => openModule(DEMO_MENU_ITEM_INICIAL)}
          >
            {WELCOME_CTA}
            <span aria-hidden>→</span>
          </button>
        </div>
      </section>

      <section className="recepcao-atalhos" aria-labelledby="recepcao-atalhos-titulo">
        <header className="recepcao-atalhos__cabecalho">
          <h2 id="recepcao-atalhos-titulo" className="recepcao-atalhos__titulo">
            Atalhos
          </h2>
          <p className="recepcao-atalhos__subtitulo">Acesso rápido ao que você mais usa</p>
        </header>
        <nav className="recepcao-atalhos__grid" aria-label="Atalhos para o seu cargo">
          {WELCOME_SHORTCUTS.map((atalho) => (
            <AtalhoTile
              key={atalho.id}
              titulo={atalho.titulo}
              icone={atalho.icone}
              onClick={() => {
                if (atalho.id === 'dashboard') {
                  setActiveNav('dashboard');
                  setMainView('hub');
                }
                if (atalho.id === 'operacional') {
                  openModule(DEMO_MENU_ITEM_INICIAL);
                }
              }}
            />
          ))}
        </nav>
      </section>

      <section className="recepcao-dicas" aria-labelledby="recepcao-dicas-titulo">
        <h2 id="recepcao-dicas-titulo" className="recepcao-secao-titulo recepcao-secao-titulo--simples">
          Sugestões
        </h2>
        <ul className="recepcao-dicas__lista">
          {WELCOME_SUGGESTIONS.map((item) => (
            <li key={item.titulo} className="recepcao-dica">
              <span className="recepcao-dica__icone" aria-hidden>
                {item.icone}
              </span>
              <div className="recepcao-dica__corpo">
                <p className="recepcao-dica__titulo">{item.titulo}</p>
                <p className="recepcao-dica__texto">{item.texto}</p>
                {'rotuloLink' in item && item.rotuloLink ? (
                  <button type="button" className="recepcao-dica__link">
                    {item.rotuloLink}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="recepcao-rodape">
        <span>{DEMO_VERSION}</span>
        <span aria-hidden>·</span>
        <span>Ecossistema {DEMO_MARCA}</span>
      </p>
    </div>
  );

  const renderDashboard = () => (
    <div className="hub-page hub-page--denso hub-page--dashboard">
      <span className="hub-tag">Dashboard</span>
      <header className="hub-page-header">
        <div>
          <h1 className="hub-page-title">Olá, {primeiroNome}</h1>
          <p className="hub-page-subtitle">Apps do ecossistema Ligeirinho — escolha onde começar.</p>
        </div>
      </header>

      <div className="hub-perfil-card hub-perfil-card--pagina">
        <HubAvatar nome={DEMO_USER_NAME} />
        <div className="hub-perfil-card__info">
          <p className="hub-perfil-card__nome">{DEMO_USER_NAME}</p>
          <span className="hub-perfil-card__badge">{DEMO_USER_CARGO}</span>
        </div>
      </div>

      <section className="hub-secao--hub-admin" aria-labelledby="hub-admin-titulo">
        <div className="hub-secao-header">
          <h2 id="hub-admin-titulo" className="hub-secao-titulo">
            Hub <span>administrativo</span>
          </h2>
        </div>
        <div className="admin-subnav-wrap">
          <nav className="admin-subnav admin-subnav--home" aria-label="Atalhos do hub administrativo">
            {HUB_ADMIN_MODULOS.map((item) => (
              <button key={item.titulo} type="button" className="admin-subnav-link">
                <span aria-hidden>{item.icone}</span>
                {item.titulo}
              </button>
            ))}
          </nav>
        </div>
      </section>

      <section className="hub-secao--apps" aria-labelledby="hub-apps-titulo">
        <div className="hub-secao-header">
          <h2 id="hub-apps-titulo" className="hub-secao-titulo">
            Seus <span>apps</span>
          </h2>
        </div>
        <div className="hub-apps-launcher-grid hub-apps-launcher-grid--home">
          {APPS_SISTEMA_DEMO.map((app, i) => (
            <AppLauncherCard key={app.id} app={app} staggerIndex={i} onOpen={() => openAppEntrada(app.id)} />
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <div className="lhDemo">
      <div className="lhDemo__banner">
        <span>{DEMO_BANNER}</span>
        <Link to="/sistemas">← Voltar ao Hub</Link>
      </div>

      <div className="layout-hub">
        <aside className="menu-lateral">
          <div className="menu-marca">
            <img src="/img/systems/ligeirinho.png" alt="" className="menu-marca-logo" />
            <div className="menu-marca-texto">
              <span className="menu-marca-titulo">Ligeirinho Hub</span>
              <span className="menu-marca-versao">{DEMO_VERSION}</span>
            </div>
          </div>

          <nav className="menu-nav" aria-label="Menu principal">
            <div className="menu-secao">
              <ul>
                {HUB_NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`menu-link${activeNav === item.id ? ' ativo' : ''}`}
                      onClick={() => {
                        setActiveNav(item.id);
                        setMainView('hub');
                      }}
                    >
                      <span className="menu-link-icone" aria-hidden>
                        {item.icone}
                      </span>
                      <span className="menu-link-texto">{item.titulo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="menu-secao menu-secao-apps">
              <span className="menu-secao-titulo">
                Aplicativos
                <span className="menu-secao-badge" aria-label={`${APPS_SISTEMA_DEMO.length} apps`}>
                  {APPS_SISTEMA_DEMO.length}
                </span>
              </span>
              <ul className="menu-apps-gaveta" aria-label="Apps do ecossistema">
                {APPS_SISTEMA_DEMO.map((app) => (
                  <DemoAppMenuGroup
                    key={app.id}
                    app={app}
                    aberto={appExpandidoId === app.id}
                    activeItem={activeMenuItem}
                    onToggle={() => setAppExpandidoId((atual) => (atual === app.id ? '' : app.id))}
                    onSelectItem={(key) => {
                      openModule(key);
                    }}
                  />
                ))}
              </ul>
            </div>
          </nav>

          <div className="menu-rodape">
            <button type="button" className="menu-rodape-suporte" title="Suporte — solicitar ajuste no sistema">
              <span className="menu-rodape-suporte__icone" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                </svg>
              </span>
              <span className="menu-rodape-suporte__texto">
                <strong className="menu-rodape-suporte__titulo">Suporte</strong>
                <span className="menu-rodape-suporte__descricao">Solicitar ajuste no sistema</span>
              </span>
            </button>
          </div>
        </aside>

        <main className="conteudo-principal">
          {renderTopbarAvatar()}
          {mainView === 'module' && moduleSelection ? (
            <LigeirinhoDemoModuleView
              app={moduleSelection.app}
              grupoTitulo={moduleSelection.grupo.titulo}
              item={moduleSelection.item}
            />
          ) : activeNav === 'bem-vindo' ? (
            renderWelcome()
          ) : (
            renderDashboard()
          )}
        </main>
      </div>

      <SistemaDemoChat demoId="ligeirinho" fabVariant="ligeirinho" />
    </div>
  );
}
