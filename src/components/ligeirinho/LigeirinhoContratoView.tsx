import {
  LIGEIRINHO_CONTRATO,
  LIGEIRINHO_CONTRATO_FASES,
  LIGEIRINHO_CONTRATO_MODULOS,
} from '../../lib/ligeirinhoDocumentacao';
import styles from './LigeirinhoContratoView.module.css';

interface LigeirinhoContratoViewProps {
  theme?: 'hub' | 'client';
}

export function LigeirinhoContratoView({ theme = 'hub' }: LigeirinhoContratoViewProps) {
  const rootClass = theme === 'client' ? `${styles.page} ${styles.clientTheme}` : styles.page;
  const c = LIGEIRINHO_CONTRATO;

  return (
    <div className={rootClass}>
      <section className={styles.summary} aria-labelledby="contrato-resumo">
        <h2 id="contrato-resumo" className={styles.summaryTitle}>
          {c.titulo}
        </h2>
        <p className={styles.summarySub}>
          {c.subtitulo} · Assinado em {c.dataAssinatura}, {c.local}
        </p>

        <div className={styles.metaGrid}>
          <div className={styles.metaCard}>
            <p className={styles.metaLabel}>Contratada</p>
            <p className={styles.metaValue}>
              {c.contratada.nome}
              <br />
              CNPJ {c.contratada.cnpj}
              <br />
              {c.contratada.representante}
            </p>
          </div>
          <div className={styles.metaCard}>
            <p className={styles.metaLabel}>Contratante</p>
            <p className={styles.metaValue}>
              {c.contratante.nome}
              <br />
              CNPJ {c.contratante.cnpj}
              <br />
              {c.contratante.representante}
            </p>
          </div>
          <div className={styles.metaCard}>
            <p className={styles.metaLabel}>Investimento</p>
            <p className={styles.metaValue}>
              Total: {c.investimentoTotal}
              <br />
              {c.entrada}
              <br />
              {c.parcelas}
            </p>
          </div>
          <div className={styles.metaCard}>
            <p className={styles.metaLabel}>Mensalidade e pagamento</p>
            <p className={styles.metaValue}>
              {c.mensalidade}
              <br />
              PIX: {c.pix}
              <br />
              Referência: {c.pixReferencia}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="contrato-modulos">
        <p className={styles.sectionLabel}>Escopo técnico</p>
        <h3 id="contrato-modulos" className={styles.sectionTitle}>
          Módulos do Ligeirinho Hub
        </h3>
        <div className={styles.moduleGrid}>
          {LIGEIRINHO_CONTRATO_MODULOS.map((mod) => (
            <article key={mod.nome} className={styles.moduleCard}>
              <h4 className={styles.moduleName}>{mod.nome}</h4>
              <p className={styles.moduleDesc}>{mod.descricao}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="contrato-cronograma">
        <p className={styles.sectionLabel}>Cronograma</p>
        <h3 id="contrato-cronograma" className={styles.sectionTitle}>
          Go-Live em {c.prazoGoLive}
        </h3>
        <ul className={styles.phaseList}>
          {LIGEIRINHO_CONTRATO_FASES.map((fase) => (
            <li key={fase.fase} className={styles.phaseItem}>
              <span className={styles.phaseTag}>{fase.fase}</span>
              <p className={styles.phaseTitle}>{fase.titulo}</p>
              <p className={styles.phaseDesc}>{fase.descricao}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="contrato-paginas">
        <p className={styles.sectionLabel}>Documento original</p>
        <h3 id="contrato-paginas" className={styles.sectionTitle}>
          Contrato assinado (digitalizado)
        </h3>
        <div className={styles.pages}>
          {c.paginas.map((pagina) => (
            <figure key={pagina.src} className={styles.pageCard}>
              <figcaption className={styles.pageLabel}>{pagina.label}</figcaption>
              <img src={pagina.src} alt={pagina.alt} className={styles.pageImage} loading="lazy" />
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
