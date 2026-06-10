import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { SystemCard } from '../components/SystemCard';
import { LIGEIRINHO_CONTRATO, LIGEIRINHO_CONTRATO_HUB_PATH } from '../lib/ligeirinhoDocumentacao';
import { supabase, supabaseErrorMessage } from '../lib/supabase';
import type { HubSystem } from '../types/database';
import styles from './SystemsPage.module.css';

export function SystemsPage() {
  const { podeDocumentacao } = useAuth();
  const [systems, setSystems] = useState<HubSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        subtitle="Produtos NEXUS — abrem em nova aba."
      />
      {error && <div className="error-banner">{error}</div>}
      {loading && <p style={{ color: 'var(--muted)' }}>Carregando…</p>}
      <div className="product-grid">
        {systems.map((sys) => (
          <SystemCard key={sys.id} system={sys} />
        ))}
      </div>

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
    </div>
  );
}
