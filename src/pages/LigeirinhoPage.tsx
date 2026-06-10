import { type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { systemLogoUrl } from '../lib/systemLogos';
import {
  deliveryStatusLabel,
  LIGEIRINHO_ATTENTION_POINTS,
  LIGEIRINHO_DELIVERIES,
  LIGEIRINHO_HUB_URL,
  LIGEIRINHO_LOJA_URL,
  LIGEIRINHO_NEXT_STEPS,
  LIGEIRINHO_READY_GROUPS,
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
        title="Ligeirinho Hub"
        subtitle="Relatório de atividades · sistema central da operação"
        actions={
          <>
            <a
              href={LIGEIRINHO_HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Abrir Ligeirinho Hub
            </a>
            <Link to="/sistemas" className="btn-ghost">
              Todos os sistemas
            </Link>
          </>
        }
      />

      <section className={styles.hero} aria-labelledby="ligeirinho-hero-title">
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Relatório para o cliente</p>
          <h2 id="ligeirinho-hero-title" className={styles.heroTitle}>
            Cadastros, vendas, pedidos e marketing em um só lugar
          </h2>
          <p className={styles.heroLead}>
            O Ligeirinho Hub é o sistema central da operação — acessível pelo navegador,
            com PDV, fila operacional, catálogo unificado e ferramentas de marketing com IA.
          </p>
          <p className={styles.heroMeta}>
            Atualizado em <time dateTime="2026-06-10">{LIGEIRINHO_STATUS_DATE}</time>
            {' · '}
            <a href={LIGEIRINHO_HUB_URL} target="_blank" rel="noopener noreferrer" className={styles.siteLink}>
              ligeirinhohub.vercel.app
            </a>
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{DONE_COUNT}/{LIGEIRINHO_DELIVERIES.length}</span>
              <span className={styles.statLabel}>Entregas concluídas</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{LIGEIRINHO_READY_GROUPS.length}</span>
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
              <img src={logo} alt="" className={styles.brandLogo} />
            </div>
          </div>
          <p className={styles.heroStage}>
            Identidade <strong>amarelo/dourado</strong> no ar
          </p>
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
            Melhorias entregues na operação, cadastros, pagamentos, marketing e organização do Hub.
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
              {LIGEIRINHO_DELIVERIES.map((row) => (
                <tr key={row.title}>
                  <td>
                    <span className={styles.deliveryTitle}>{row.title}</span>
                    {row.note ? <span className={styles.deliveryNote}>{row.note}</span> : null}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        row.status === 'done'
                          ? styles.statusDone
                          : row.status === 'pending'
                            ? styles.statusPending
                            : styles.statusStudy
                      }`}
                    >
                      {deliveryStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="proximos" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionLabel}>Recomendado</p>
          <h2 className={styles.sectionTitle}>Próximos passos</h2>
          <p className={styles.sectionDesc}>
            Ações sugeridas para validar o marketing com IA e colocar tudo em uso na loja.
          </p>
        </div>

        <ol className={styles.flow}>
          {LIGEIRINHO_NEXT_STEPS.map((step, index) => (
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
            Pendências, limites e itens em análise — sem surpresas para o cliente.
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
          <h2 className={styles.ctaTitle}>Acessar os sistemas</h2>
          <p className={styles.ctaText}>
            Hub para operação interna; loja online para pedidos do cliente final.
          </p>
        </div>
        <div className={styles.ctaActions}>
          <a
            href={LIGEIRINHO_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-primary ${styles.ctaBtn}`}
          >
            Abrir ligeirinhohub.vercel.app
          </a>
          <a
            href={LIGEIRINHO_LOJA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-ghost ${styles.ctaBtn}`}
          >
            Loja online (Parceiros)
          </a>
        </div>
      </section>
    </div>
  );
}
