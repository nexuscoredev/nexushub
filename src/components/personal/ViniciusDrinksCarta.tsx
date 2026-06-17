import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  VINICIUS_DRINKS,
  VINICIUS_DRINKS_BANNER_URL,
  findViniciusDrink,
} from '../../lib/viniciusDrinksCarta';
import styles from './ViniciusDrinksCarta.module.css';

export function ViniciusDrinksCarta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeSlug = searchParams.get('drink');
  const activeDrink = useMemo(() => findViniciusDrink(activeSlug), [activeSlug]);

  const openDrink = (slug: string) => {
    navigate(`/pessoal?drinks=1&drink=${slug}`);
  };

  const backToList = () => {
    navigate('/pessoal?drinks=1');
  };

  if (activeDrink) {
    return (
      <div className={styles.carta}>
        <button type="button" className={styles.backLink} onClick={backToList}>
          ← Carta
        </button>

        <article className={styles.detail}>
          <div className={styles.detailMedia}>
            <img
              src={activeDrink.imageUrl}
              alt=""
              className={styles.detailPhoto}
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className={styles.detailBody}>
            <h2 className={styles.detailTitle}>{activeDrink.title}</h2>
            <p className={styles.detailTagline}>{activeDrink.tagline}</p>

            {activeDrink.ingredients.length ? (
              <div className={styles.recipeBlock}>
                <h3 className={styles.recipeHeading}>Ingredientes</h3>
                <ul className={styles.recipeList}>
                  {activeDrink.ingredients.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {activeDrink.notes ? <p className={styles.recipeNote}>{activeDrink.notes}</p> : null}
                {activeDrink.steps.length ? (
                  <>
                    <h3 className={styles.recipeHeading}>Passos</h3>
                    <ol className={styles.recipeSteps}>
                      {activeDrink.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className={styles.carta}>
      <header className={styles.banner}>
        <img src={VINICIUS_DRINKS_BANNER_URL} alt="" className={styles.bannerImg} loading="eager" decoding="async" />
        <div className={styles.bannerOverlay} />
        <div className={styles.bannerCopy}>
          <p className={styles.bannerEyebrow}>Só seu · privado</p>
          <h2 className={styles.bannerTitle}>Carta de drinks</h2>
          <p className={styles.bannerLead}>Suas receitas favoritas — do jeito que você montou.</p>
        </div>
      </header>

      <ul className={styles.list}>
        {VINICIUS_DRINKS.map((drink) => (
          <li key={drink.slug}>
            <button type="button" className={styles.card} onClick={() => openDrink(drink.slug)}>
              <span className={styles.cardMedia}>
                <img src={drink.imageUrl} alt="" loading="lazy" decoding="async" />
              </span>
              <span className={styles.cardBody}>
                <span className={styles.cardTitle}>{drink.title}</span>
                <span className={styles.cardTagline}>{drink.tagline}</span>
              </span>
              <span className={styles.cardArrow} aria-hidden>
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
