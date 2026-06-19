import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  VINICIUS_DRINKS,
  drinkThumbPath,
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
        <div className={styles.bannerAtmosphere} aria-hidden />
        <div className={styles.bannerOrbA} aria-hidden />
        <div className={styles.bannerOrbB} aria-hidden />
        <div className={styles.bannerGrid}>
          <div className={styles.bannerHero}>
            <div className={styles.bannerHeroGlow} aria-hidden />
            <div className={styles.bannerHeroRing} aria-hidden />
            <img
              src={drinkThumbPath('whisky-sour')}
              alt=""
              className={styles.bannerHeroImg}
              loading="eager"
              decoding="async"
            />
          </div>
          <div className={styles.bannerCopy}>
            <p className={styles.bannerEyebrow}>
              <span className={styles.bannerEyebrowDot} aria-hidden />
              Só seu · privado
            </p>
            <h2 className={styles.bannerTitle}>
              Carta de <span className={styles.bannerTitleAccent}>drinks</span>
            </h2>
            <p className={styles.bannerLead}>
              Suas receitas favoritas — clássicos, twists e clássicos da casa, do jeito que você montou.
            </p>
            <div className={styles.bannerMeta}>
              <span className={styles.bannerPill}>{VINICIUS_DRINKS.length} receitas</span>
              <span className={styles.bannerPill}>Bar digital</span>
            </div>
          </div>
        </div>
        <div className={styles.bannerShine} aria-hidden />
        <div className={styles.bannerGrain} aria-hidden />
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
