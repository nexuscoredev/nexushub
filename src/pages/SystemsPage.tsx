import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { HubSystemHealthPanel } from '../components/HubSystemHealthPanel';
import { PageHeader } from '../components/PageHeader';
import { SystemDetailsModal } from '../components/SystemDetailsModal';
import { useAuth } from '../contexts/AuthContext';
import { SystemCard } from '../components/SystemCard';
import { SISTEMAS_DEMOS } from '../data/sistemasTemplates';
import { LIGEIRINHO_CONTRATO, LIGEIRINHO_CONTRATO_HUB_PATH } from '../lib/ligeirinhoDocumentacao';
import { supabase, supabaseErrorMessage } from '../lib/supabase';
import type { HubSystem } from '../types/database';
import styles from './SystemsPage.module.css';

type SystemsTab = 'sistemas' | 'templates';

export function SystemsPage() {
  const { podeDocumentacao } = useAuth();
  const [tab, setTab] = useState<SystemsTab>('sistemas');
  const [systems, setSystems] = useState<HubSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsSystem, setDetailsSystem] = useState<HubSystem | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    void supabase
      .from('hub_systems')
      .select('*')
      .eq('ativo', true)
      .order('ordem')
      .then(({ data, error: err }) => {
        if (err) setError(supabaseErrorMessage(err));
        else setSystems((data ?? []) as HubSystem[]);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <PageHeader
        badge="Integrations"
        title="Sistemas"
        subtitle={
          tab === 'templates'
            ? 'Templates internos para reuniões — dados fictícios, sem vínculo com produção.'
            : 'Produtos NEXUS — abrem em nova aba.'
        }
      />

      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === 'sistemas' ? 'active' : ''}`}
          onClick={() => setTab('sistemas')}
        >
          Sistemas
        </button>
        <button
          type="button"
          className={`tab ${tab === 'templates' ? 'active' : ''}`}
          onClick={() => setTab('templates')}
        >
          Templates
        </button>
      </div>

      {tab === 'templates' && (
        <div className={styles.demoHub}>
          <header className={styles.demoHubBanner}>
            <span className={styles.demoHubPulse} aria-hidden />
            <div className={styles.demoHubCopy}>
              <p className={styles.demoHubEyebrow}>Uso interno · NEXUS Hub</p>
              <h2 className={styles.demoHubTitle}>Laboratório de demonstrações</h2>
              <p className={styles.demoHubLead}>
                Ambientes interativos para apresentar escopo, fluxo e interface em reuniões. Nenhum dado
                exibido corresponde a clientes, rotas ou operações reais.
              </p>
            </div>
            <ul className={styles.demoHubTags} aria-label="Características das demonstrações">
              <li>Dados fictícios</li>
              <li>Marca genérica</li>
              <li>Sem integração prod.</li>
            </ul>
          </header>

          <div className={styles.demoGrid}>
            {SISTEMAS_DEMOS.map((demo, i) => (
              <article
                key={demo.id}
                className={styles.demoCard}
                style={
                  {
                    '--demo-accent': demo.accent,
                    '--demo-accent-soft': demo.accentSoft,
                    '--stagger': i,
                  } as CSSProperties
                }
              >
                <div className={styles.demoCardGlow} aria-hidden />
                <div className={styles.demoCardTop}>
                  <span className={styles.demoCardIcon} aria-hidden>
                    <span className="material-symbols-outlined">{demo.icon}</span>
                  </span>
                  <span className={styles.templateCategory}>{demo.category}</span>
                </div>
                <h2 className={styles.demoCardTitle}>{demo.title}</h2>
                <p className={styles.demoCardDesc}>{demo.description}</p>
                <ul className={styles.demoModules} aria-label="Módulos incluídos">
                  {demo.modules.map((mod) => (
                    <li key={mod}>{mod}</li>
                  ))}
                </ul>
                <div className={styles.demoCardFooter}>
                  <span className={styles.demoCardNote}>Fictício · não publicar</span>
                  <Link to={`/sistemas/demo/${demo.demoId}`} className={`btn-primary ${styles.demoBtn}`}>
                    Abrir demonstração
                  </Link>
                </div>
              </article>
            ))}

            <aside className={styles.demoGuide}>
              <span className={styles.demoGuideIcon} aria-hidden>
                <span className="material-symbols-outlined">tips_and_updates</span>
              </span>
              <h3 className={styles.demoGuideTitle}>Como apresentar</h3>
              <ul className={styles.demoGuideList}>
                <li>Abra a demonstração em tela cheia durante a reunião.</li>
                <li>Navegue pelo menu lateral para mostrar cada etapa do fluxo.</li>
                <li>Destaque que números, nomes e rotas são apenas ilustrativos.</li>
                <li>Use como base para discutir escopo e replicação do produto.</li>
              </ul>
              <p className={styles.demoGuideFoot}>
                Novos templates podem ser adicionados conforme novos verticais forem modelados.
              </p>
            </aside>
          </div>
        </div>
      )}

      {tab === 'sistemas' && (
        <>
          {error && <div className="error-banner">{error}</div>}
          <HubSystemHealthPanel />
          {loading && <p style={{ color: 'var(--muted)' }}>Carregando…</p>}
          <div className="product-grid">
            {systems.map((sys) => (
              <SystemCard key={sys.id} system={sys} onDetalhes={setDetailsSystem} />
            ))}
          </div>

          <SystemDetailsModal
            system={detailsSystem}
            open={detailsSystem !== null}
            onClose={() => setDetailsSystem(null)}
          />

          {podeDocumentacao && systems.some((s) => s.id === 'ligeirinho') ? (
            <section className={styles.docSection} aria-labelledby="ligeirinho-doc-title">
              <h2 id="ligeirinho-doc-title" className="section-heading">
                Documentação Ligeirinho
              </h2>
              <article className={styles.docCard}>
                <div>
                  <h3 className={styles.docTitle}>{LIGEIRINHO_CONTRATO.titulo}</h3>
                  <p className={styles.docDesc}>
                    Contrato executivo V8 — escopo do Hub (PDV, Totem, Operacional e Logística),
                    investimento, cronograma de 45 dias e condições comerciais.
                  </p>
                </div>
                <div className={styles.docActions}>
                  <Link to={LIGEIRINHO_CONTRATO_HUB_PATH} className="btn-primary">
                    Ver documentação
                  </Link>
                  <a
                    href="/docs/ligeirinho/contrato-v8-pagina-1.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                  >
                    Abrir digitalizado
                  </a>
                </div>
              </article>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
