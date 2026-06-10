import { type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { systemLogoUrl } from '../lib/systemLogos';
import {
  LIGEIRINHO_ATTENTION_POINTS,
  LIGEIRINHO_CLIENT_FLOW,
  LIGEIRINHO_DELIVERIES,
  LIGEIRINHO_READY_GROUPS,
  LIGEIRINHO_SITE_URL,
  LIGEIRINHO_STATUS_DATE,
  LIGEIRINHO_SUMMARY,
} from '../lib/ligeirinhoProject';
import styles from './LigeirinhoPage.module.css';

const DONE_COUNT = LIGEIRINHO_DELIVERIES.filter((d) => d.status === 'done').length;

export function LigeirinhoPage() {
  const logo = systemLogoUrl('ligeirinho');
  const progressPct = Math.round((DONE_COUNT / LIGEIRINHO_DELIVERIES.length) * 100);

  return (
    <div className={styles.page}>
      <PageHeader
        badge="Produto NEXUS"
        title="Ligeirinho Parceiros"
        subtitle="Status do projeto · app de pedidos online"
        actions={
          <>
            <a
              href={LIGEIRINHO_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Abrir loja ao vivo
            </a>
            <Link to="/sistemas" className="btn-ghost">
              Todos os sistemas
            </Link>
          </>
        }
      />

      <section className={styles.hero} aria-labelledby="ligeirinho-hero-title">
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Status report</p>
          <h2 id="ligeirinho-hero-title" className={styles.heroTitle}>
            Pedidos pela internet, prontos para o dia a dia da loja
          </h2>
          <p className={styles.heroLead}>
            O Ligeirinho virou um aplicativo de pedidos que o cliente usa no celular ou no
            computador — catálogo, carrinho, login e pagamento online nas versões mais recentes.
          </p>
          <p className={styles.heroMeta}>
            Atualizado em <time dateTime="2026-06-09">{LIGEIRINHO_STATUS_DATE}</time>
            {' · '}
            <a href={LIGEIRINHO_SITE_URL} target="_blank" rel="noopener noreferrer" className={styles.siteLink}>
              ligeirinhobebidas.vercel.app
            </a>
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{DONE_COUNT}/{LIGEIRINHO_DELIVERIES.length}</span>
              <span className={styles.statLabel}>Entregas concluídas</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{LIGEIRINHO_READY_GROUPS.length}</span>
              <span className={styles.statLabel}>Áreas prontas</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{progressPct}%</span>
              <span className={styles.statLabel}>Roadmap deste ciclo</span>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden>
          <div
            className={styles.progressRing}
            style={{ '--progress': `${progressPct}%` } as CSSProperties}
          >
            <div className={styles.progressRingInner}>
              <img src={logo} alt="" className={styles.brandLogo} />
            </div>
          </div>
          <p className={styles.heroStage}>
            Marca <strong>Ligeirinho Parceiros</strong> no ar
          </p>
        </div>
      </section>

      <section className={styles.highlight} aria-labelledby="resumo-title">
        <div className={styles.sectionHead}>
          <p className={styles.sectionLabel}>Em uma frase</p>
          <h2 id="resumo-title" className={styles.sectionTitle}>
            Resumo do projeto
          </h2>
        </div>
        <div className={styles.highlightCard}>
          <p className={styles.highlightText}>{LIGEIRINHO_SUMMARY}</p>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
          <p className={styles.progressCaption}>{progressPct}% das entregas deste relatório concluídas</p>
        </div>
      </section>

      <section id="pronto" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionLabel}>Capacidades</p>
          <h2 className={styles.sectionTitle}>O que já está pronto</h2>
          <p className={styles.sectionDesc}>
            Funcionalidades em produção ou estáveis para o cliente final usar hoje.
          </p>
        </div>

        <div className={styles.featureGrid}>
          {LIGEIRINHO_READY_GROUPS.map((group) => (
            <article key={group.id} className={styles.featureCard}>
              <header className={styles.featureHead}>
                <h3 className={styles.featureTitle}>{group.title}</h3>
                <p className={styles.featureSub}>{group.subtitle}</p>
              </header>
              <ul className={styles.featureList}>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="entregas" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionLabel}>Período recente</p>
          <h2 className={styles.sectionTitle}>O que fizemos neste período</h2>
          <p className={styles.sectionDesc}>
            Entregas em linguagem simples — o que entrou no ar e o que ficou para depois.
          </p>
        </div>

        <div className={styles.deliveryTableWrap}>
          <table className={styles.deliveryTable}>
            <thead>
              <tr>
                <th scope="col">Entrega</th>
                <th scope="col">Situação</th>
              </tr>
            </thead>
            <tbody>
              {LIGEIRINHO_DELIVERIES.map((row) => (
                <tr key={row.title}>
                  <td>
                    <span className={styles.deliveryTitle}>{row.title}</span>
                    {row.note ? <span className={styles.deliveryNote}>{row.note}</span> : null}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        row.status === 'done' ? styles.statusDone : styles.statusPaused
                      }`}
                    >
                      {row.status === 'done' ? 'Concluído' : 'Para depois'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="fluxo" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionLabel}>Jornada</p>
          <h2 className={styles.sectionTitle}>Como o cliente usa hoje</h2>
          <p className={styles.sectionDesc}>
            Fluxo real, do primeiro acesso até a confirmação do pedido.
          </p>
        </div>

        <ol className={styles.flow}>
          {LIGEIRINHO_CLIENT_FLOW.map((step, index) => (
            <li key={step} className={styles.flowItem}>
              <span className={styles.flowMarker}>{index + 1}</span>
              <p className={styles.flowText}>{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="atencao" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionLabel}>Transparência</p>
          <h2 className={styles.sectionTitle}>Pontos de atenção</h2>
          <p className={styles.sectionDesc}>
            Limitações conscientes e decisões de produto — sem surpresas para o cliente.
          </p>
        </div>

        <ul className={styles.attentionList}>
          {LIGEIRINHO_ATTENTION_POINTS.map((point) => (
            <li key={point.title} className={styles.attentionCard}>
              <h3 className={styles.attentionTitle}>{point.title}</h3>
              <p className={styles.attentionText}>{point.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaCopy}>
          <h2 className={styles.ctaTitle}>Ver o app funcionando</h2>
          <p className={styles.ctaText}>
            Acesse a loja publicada, teste no celular e instale na tela inicial como PWA.
          </p>
        </div>
        <div className={styles.ctaActions}>
          <a
            href={LIGEIRINHO_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-primary ${styles.ctaBtn}`}
          >
            Abrir ligeirinhobebidas.vercel.app
          </a>
          <Link to="/cliente/entrar" className={`btn-ghost ${styles.ctaBtn}`}>
            Portal do cliente NEXUS
          </Link>
        </div>
      </section>
    </div>
  );
}
