import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { DemoDataNotice } from '../../components/DemoDataNotice';
import {
  buildModuleContent,
  subtituloForMenuItem,
} from './ligeirinhoDemoContent';
import { menuItemKey, temaApp, type LigeirinhoDemoApp, type LigeirinhoDemoMenuItem } from './ligeirinhoDemoData';

interface LigeirinhoDemoModuleViewProps {
  app: LigeirinhoDemoApp;
  grupoTitulo: string;
  item: LigeirinhoDemoMenuItem;
}

export function LigeirinhoDemoModuleView({ app, grupoTitulo, item }: LigeirinhoDemoModuleViewProps) {
  const menuKey = menuItemKey(app.id, grupoTitulo, item.id);
  const content = useMemo(() => buildModuleContent(menuKey, app.id, item.id), [menuKey, app.id, item.id]);
  const subtitulo = subtituloForMenuItem(item.id, app);

  return (
    <div
      className="hub-page hub-page--denso app-module-page"
      style={temaApp(app) as CSSProperties}
    >
      <header className="app-module-header">
        <span className="app-module-tag">{app.iconeLabel ?? app.nome}</span>
        <h1 className="app-module-title">{item.titulo}</h1>
        <p className="app-module-subtitle">{subtitulo}</p>
      </header>

      <DemoDataNotice />

      {content.layout === 'fila' && content.fila ? (
        <ul className="ops-fila">
          {content.fila.map((p) => (
            <li key={p.numero} className="ops-fila-linha">
              <div className="ops-fila-item">
                <span className="ops-fila-num">#{p.numero}</span>
                <span className="ops-fila-corpo">
                  <strong>{p.cliente}</strong>
                  <span className="ops-fila-meta">
                    {p.status} · {p.valor}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {content.layout === 'pedidos' || content.layout === 'tabela' ? (
        content.tabela ? (
          <div className="lhDemo-table-wrap">
            <table className="lhDemo-table">
              <thead>
                <tr>
                  {content.tabela.headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.tabela.rows.map((row, i) => (
                  <tr key={i}>
                    {row.cols.map((c, j) => (
                      <td key={j}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null
      ) : null}

      {content.layout === 'kpi-estoque' || content.layout === 'kpi-rh' ? (
        <>
          {content.kpis ? (
            <div className="est-kpis">
              {content.kpis.map((kpi) => (
                <div key={kpi.rotulo} className={`est-kpi${kpi.alerta ? ' est-kpi--alerta' : ''}`}>
                  <strong>{kpi.valor}</strong>
                  <span>{kpi.rotulo}</span>
                </div>
              ))}
            </div>
          ) : null}
          {content.listas ? (
            <div className="est-painel-grid">
              {content.listas.map((lista) => (
                <section key={lista.titulo} className="est-painel-card">
                  <h2 className="est-painel-card__titulo">{lista.titulo}</h2>
                  <ul className="est-painel-lista">
                    {lista.itens.map((linha) => (
                      <li key={linha}>{linha}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {content.layout === 'colaboradores' && content.colaboradores ? (
        <div className="lhDemo-table-wrap">
            <table className="lhDemo-table lhDemo-table--colab">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Cargo</th>
                  <th>Departamento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {content.colaboradores.map((c) => (
                  <tr key={c.nome}>
                    <td>
                      <span className="dep-colab-nome">
                        <span className="dep-colab-avatar" aria-hidden>
                          {c.nome
                            .split(' ')
                            .map((p) => p[0])
                            .join('')
                            .slice(0, 2)}
                        </span>
                        {c.nome}
                      </span>
                    </td>
                    <td>{c.cargo}</td>
                    <td>{c.dept}</td>
                    <td>
                      <span className={`dep-status dep-status--${c.status === 'Ativo' ? 'ok' : 'muted'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      ) : null}

      {content.layout === 'tv' && content.tv ? (
        <div className="tv-alertas-grid">
          {content.tv.map((a) => (
            <article key={a.titulo} className={`tv-alerta tv-alerta--${a.nivel}`}>
              <h2>{a.titulo}</h2>
              <p>{a.detalhe}</p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
