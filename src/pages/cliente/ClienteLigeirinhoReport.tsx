import { type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './ClienteLigeirinhoPage.module.css';

export type ReportDeliveryStatus = 'done' | 'pending' | 'study' | 'paused';

export interface ReportDelivery {
  title: string;
  status: ReportDeliveryStatus;
  note?: string;
}

export interface ReportFeatureGroup {
  id: string;
  title: string;
  subtitle: string;
  items: string[];
}

export interface ReportAttentionPoint {
  title: string;
  text: string;
}

export interface ClienteLigeirinhoReportProps {
  variant: 'hub' | 'parceiros';
  pageTitle: string;
  pageSubtitle: string;
  siteUrl: string;
  siteHost: string;
  statusDate: string;
  statusDateIso: string;
  brandLogoUrl: string;
  heroTitle: string;
  heroLead: string;
  heroStage: ReactNode;
  summary: string;
  readySectionDesc: string;
  readyGroups: ReportFeatureGroup[];
  deliveries: ReportDelivery[];
  deliveryStatusLabel: (status: ReportDeliveryStatus) => string;
  flowSection?: {
    id: string;
    label: string;
    title: string;
    desc: string;
    steps: string[];
  };
  nextStepsSection?: {
    label: string;
    title: string;
    desc: string;
    steps: string[];
  };
  attentionPoints: ReportAttentionPoint[];
  ctaTitle: string;
  ctaText: string;
  ctaPrimaryLabel: string;
  ctaSecondary?: { href?: string; to?: string; label: string };
  otherReport?: { to: string; label: string };
}

function deliveryStatusClass(status: ReportDeliveryStatus): string {
  if (status === 'done') return styles.statusDone;
  if (status === 'pending') return styles.statusPending;
  if (status === 'paused') return styles.statusPaused;
  return styles.statusStudy;
}

export function ClienteLigeirinhoReport({
  variant,
  pageTitle,
  pageSubtitle,
  siteUrl,
  siteHost,
  statusDate,
  statusDateIso,
  brandLogoUrl,
  heroTitle,
  heroLead,
  heroStage,
  summary,
  readySectionDesc,
  readyGroups,
  deliveries,
  deliveryStatusLabel,
  flowSection,
  nextStepsSection,
  attentionPoints,
  ctaTitle,
  ctaText,
  ctaPrimaryLabel,
  ctaSecondary,
  otherReport,
}: ClienteLigeirinhoReportProps) {
  const doneCount = deliveries.filter((d) => d.status === 'done').length;
  const progressPct = Math.round((doneCount / deliveries.length) * 100);
  const pageClass = variant === 'parceiros' ? `${styles.page} ${styles.pageParceiros}` : styles.page;

  return (
    <div className={pageClass}>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.pageEyebrow}>Seu sistema</p>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
          <p className={styles.pageSubtitle}>{pageSubtitle}</p>
        </div>
        <div className={styles.pageActions}>
          <a href={siteUrl} target="_blank" rel="noopener noreferrer" className={styles.btnPrimary}>
            {ctaPrimaryLabel}
          </a>
          <Link to="/cliente" className={styles.btnGhost}>
            Voltar ao painel
          </Link>
          {otherReport ? (
            <Link to={otherReport.to} className={styles.btnGhost}>
              {otherReport.label}
            </Link>
          ) : null}
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="ligeirinho-hero-title">
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Relatório para o cliente</p>
          <h2 id="ligeirinho-hero-title" className={styles.heroTitle}>
            {heroTitle}
          </h2>
          <p className={styles.heroLead}>{heroLead}</p>
          <p className={styles.heroMeta}>
            Atualizado em <time dateTime={statusDateIso}>{statusDate}</time>
            {' · '}
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" className={styles.siteLink}>
              {siteHost}
            </a>
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {doneCount}/{deliveries.length}
              </span>
              <span className={styles.statLabel}>Entregas concluídas</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{readyGroups.length}</span>
              <span className={styles.statLabel}>Áreas evoluídas</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{progressPct}%</span>
              <span className={styles.statLabel}>Avanço do relatório</span>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden>
          <div
            className={styles.progressRing}
            style={{ '--progress': `${progressPct}%` } as CSSProperties}
          >
            <div className={styles.progressRingInner}>
              <img src={brandLogoUrl} alt="" className={styles.brandLogo} />
            </div>
          </div>
          <p className={styles.heroStage}>{heroStage}</p>
        </div>
      </section>

      <section className={styles.highlight} aria-labelledby="resumo-title">
        <div className={styles.sectionHead}>
          <p className={styles.sectionLabel}>Visão geral</p>
          <h2 id="resumo-title" className={styles.sectionTitle}>
            Resumo do projeto
          </h2>
        </div>
        <div className={styles.highlightCard}>
          <p className={styles.highlightText}>{summary}</p>
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
          <p className={styles.sectionDesc}>{readySectionDesc}</p>
        </div>

        <div className={styles.featureGrid}>
          {readyGroups.map((group) => (
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
          <h2 className={styles.sectionTitle}>Relatório de atividades</h2>
          <p className={styles.sectionDesc}>
            Entregas em linguagem simples — o que entrou no ar, o que falta e o que está em estudo.
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
              {deliveries.map((row) => (
                <tr key={row.title}>
                  <td>
                    <span className={styles.deliveryTitle}>{row.title}</span>
                    {row.note ? <span className={styles.deliveryNote}>{row.note}</span> : null}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${deliveryStatusClass(row.status)}`}>
                      {deliveryStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {flowSection ? (
        <section id={flowSection.id} className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{flowSection.label}</p>
            <h2 className={styles.sectionTitle}>{flowSection.title}</h2>
            <p className={styles.sectionDesc}>{flowSection.desc}</p>
          </div>

          <ol className={styles.flow}>
            {flowSection.steps.map((step, index) => (
              <li key={step} className={styles.flowItem}>
                <span className={styles.flowMarker}>{index + 1}</span>
                <p className={styles.flowText}>{step}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {nextStepsSection ? (
        <section id="proximos" className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>{nextStepsSection.label}</p>
            <h2 className={styles.sectionTitle}>{nextStepsSection.title}</h2>
            <p className={styles.sectionDesc}>{nextStepsSection.desc}</p>
          </div>

          <ol className={styles.flow}>
            {nextStepsSection.steps.map((step, index) => (
              <li key={step} className={styles.flowItem}>
                <span className={styles.flowMarker}>{index + 1}</span>
                <p className={styles.flowText}>{step}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section id="atencao" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionLabel}>Transparência</p>
          <h2 className={styles.sectionTitle}>Pontos de atenção</h2>
          <p className={styles.sectionDesc}>
            Pendências, limites e itens em análise — sem surpresas para o cliente.
          </p>
        </div>

        <ul className={styles.attentionList}>
          {attentionPoints.map((point) => (
            <li key={point.title} className={styles.attentionCard}>
              <h3 className={styles.attentionTitle}>{point.title}</h3>
              <p className={styles.attentionText}>{point.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaCopy}>
          <h2 className={styles.ctaTitle}>{ctaTitle}</h2>
          <p className={styles.ctaText}>{ctaText}</p>
        </div>
        <div className={styles.ctaActions}>
          <a href={siteUrl} target="_blank" rel="noopener noreferrer" className={styles.btnPrimary}>
            Abrir {siteHost}
          </a>
          {ctaSecondary?.href ? (
            <a href={ctaSecondary.href} target="_blank" rel="noopener noreferrer" className={styles.btnGhost}>
              {ctaSecondary.label}
            </a>
          ) : null}
          {ctaSecondary?.to ? (
            <Link to={ctaSecondary.to} className={styles.btnGhost}>
              {ctaSecondary.label}
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
