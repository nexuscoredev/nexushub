import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { findPcGuide, pcGuidesByCategory } from '../../lib/viniciusPcGuide';
import styles from './ViniciusPcGuide.module.css';

export function ViniciusPcGuide() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeSlug = searchParams.get('guide');
  const activeGuide = useMemo(() => findPcGuide(activeSlug), [activeSlug]);
  const groups = useMemo(() => pcGuidesByCategory(), []);

  const openGuide = (slug: string) => {
    navigate(`/pessoal?pc-guide=1&guide=${slug}`);
  };

  const backToList = () => {
    navigate('/pessoal?pc-guide=1');
  };

  if (activeGuide) {
    return (
      <div className={styles.wrap}>
        <button type="button" className={styles.backLink} onClick={backToList}>
          ← Guias
        </button>

        <article className={styles.detail}>
          <header className={styles.detailHeader}>
            <h2 className={styles.detailTitle}>{activeGuide.title}</h2>
            <p className={styles.detailSub}>{activeGuide.subtitle}</p>
          </header>

          <figure className={styles.figure}>
            <img
              src={activeGuide.imageUrl}
              alt={activeGuide.title}
              className={styles.guideImage}
              loading="lazy"
              decoding="async"
            />
          </figure>
        </article>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.intro}>
        Referências rápidas de controle, conexão XInput e Moonlight — só você vê aqui.
      </p>

      {groups.map((group) => (
        <section key={group.category} className={styles.group} aria-labelledby={`pc-guide-${group.category}`}>
          <h3 id={`pc-guide-${group.category}`} className={styles.groupTitle}>
            {group.label}
          </h3>
          <ul className={styles.grid}>
            {group.guides.map((guide) => (
              <li key={guide.slug}>
                <button type="button" className={styles.card} onClick={() => openGuide(guide.slug)}>
                  <span className={styles.thumbWrap}>
                    <img
                      src={guide.imageUrl}
                      alt=""
                      className={styles.thumb}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span className={styles.cardMeta}>
                    <span className={styles.cardTitle}>{guide.title}</span>
                    <span className={styles.cardSub}>{guide.subtitle}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
