import {
  LIGEIRINHO_CONTRATO,
  LIGEIRINHO_CONTRATO_FASES,
  LIGEIRINHO_CONTRATO_FASES_CLIENTE,
  LIGEIRINHO_CONTRATO_MODULOS,
  LIGEIRINHO_CONTRATO_MODULOS_CLIENTE,
} from '../../lib/ligeirinhoDocumentacao';
import styles from './LigeirinhoContratoView.module.css';

interface LigeirinhoContratoViewProps {
  theme?: 'hub' | 'client';
}

export function LigeirinhoContratoView({ theme = 'hub' }: LigeirinhoContratoViewProps) {
  const isClient = theme === 'client';
  const rootClass = isClient ? `${styles.page} ${styles.clientTheme}` : styles.page;
  const c = LIGEIRINHO_CONTRATO;
  const modulos = isClient ? LIGEIRINHO_CONTRATO_MODULOS_CLIENTE : LIGEIRINHO_CONTRATO_MODULOS;
  const fases = isClient ? LIGEIRINHO_CONTRATO_FASES_CLIENTE : LIGEIRINHO_CONTRATO_FASES;

  return (
    <div className={rootClass}>
      <section className={styles.summary} aria-labelledby="contrato-resumo">
        <h2 id="contrato-resumo" className={styles.summaryTitle}>
          {c.titulo}
        </h2>
        <p className={styles.summarySub}>
          {isClient ? 'Contrato de prestação de serviços' : c.subtitulo} · Assinado em {c.dataAssinatura},{' '}
          {c.local}
        </p>

        <div className={styles.metaGrid}>
          <div className={styles.metaCard}>
            <p className={styles.metaLabel}>NEXUS</p>
            <p className={styles.metaValue}>
              {c.contratada.nome}
              {!isClient ? (
                <>
                  <br />
                  CNPJ {c.contratada.cnpj}
                </>
              ) : null}
              <br />
              {c.contratada.representante}
            </p>
          </div>
          <div className={styles.metaCard}>
            <p className={styles.metaLabel}>Ligeirinho Bebidas</p>
            <p className={styles.metaValue}>
              {c.contratante.nome}
              {!isClient ? (
                <>
                  <br />
                  CNPJ {c.contratante.cnpj}
                </>
              ) : null}
              <br />
              {c.contratante.representante}
            </p>
          </div>
          {isClient ? (
            <div className={`${styles.metaCard} ${styles.metaCardWide}`}>
              <p className={styles.metaLabel}>Resumo comercial</p>
              <p className={styles.metaValue}>
                Investimento total: {c.investimentoTotal}
                <br />
                {c.entrada} · {c.parcelas}
                <br />
                Mensalidade após lançamento: {c.mensalidade.replace(' (infraestrutura e suporte SaaS)', '')}
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="contrato-modulos">
        <p className={styles.sectionLabel}>{isClient ? 'Escopo do projeto' : 'Escopo técnico'}</p>
        <h3 id="contrato-modulos" className={styles.sectionTitle}>
          Módulos do Ligeirinho Hub
        </h3>
        <div className={styles.moduleGrid}>
          {modulos.map((mod) => (
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
          {isClient ? `Projeto em ${c.prazoGoLive}` : `Go-Live em ${c.prazoGoLive}`}
        </h3>
        <ul className={styles.phaseList}>
          {fases.map((fase) => (
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
        {isClient ? (
          <p className={styles.docNote}>
            Valores, condições de pagamento e cláusulas completas constam no documento abaixo.
          </p>
        ) : null}
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
