import { useMemo, useState } from 'react';
import {
  capsuleGalleryImages,
  cupSizeLabel,
  formatCoffeePrice,
  intensityLabel,
} from '../../lib/coffeeCapsuleMeta';
import {
  COFFEE_CAPSULE_SYSTEMS,
  capsuleSystemIcon,
  categoryEmoji,
  type CoffeeStockItem,
} from '../../lib/viniciusCoffeeStock';
import styles from './ViniciusCoffee.module.css';

type CoffeeCapsuleDetailProps = {
  item: CoffeeStockItem;
  onBack: () => void;
  onEdit: () => void;
  onToggleQuantity: () => void;
  onToggleFavorite: () => void;
};

export function CoffeeCapsuleDetail({
  item,
  onBack,
  onEdit,
  onToggleQuantity,
  onToggleFavorite,
}: CoffeeCapsuleDetailProps) {
  const images = useMemo(() => capsuleGalleryImages(item), [item]);
  const [activeImage, setActiveImage] = useState(0);
  const safeIndex = images.length ? Math.min(activeImage, images.length - 1) : 0;
  const system = COFFEE_CAPSULE_SYSTEMS.find((entry) => entry.id === item.capsuleSystem);
  const intensityText = intensityLabel(item.intensity);
  const cupText = cupSizeLabel(item.cupSize);
  const priceText = formatCoffeePrice(item.pricePaid);
  const outOfStock = item.quantity <= 0;

  return (
    <div className={styles.productPage}>
      <header className={styles.productTopBar}>
        <button type="button" className={styles.headerBtn} onClick={onBack} aria-label="Voltar">
          ←
        </button>
        <span className={styles.productTopTitle}>Detalhes</span>
        <div className={styles.productTopActions}>
          <button
            type="button"
            className={`${styles.headerBtn} ${item.favorite ? styles.detailFavoriteOn : ''}`}
            onClick={onToggleFavorite}
            aria-label={item.favorite ? 'Remover dos favoritos' : 'Favoritar'}
          >
            ♥
          </button>
          <button type="button" className={styles.headerBtn} onClick={onEdit} aria-label="Editar">
            ✎
          </button>
        </div>
      </header>

      <div className={styles.productGallery}>
        {images.length > 1 ? (
          <div className={styles.productThumbs} aria-label="Miniaturas">
            {images.map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                className={`${styles.productThumb} ${safeIndex === index ? styles.productThumbActive : ''}`}
                onClick={() => setActiveImage(index)}
                aria-label={`Foto ${index + 1}`}
              >
                <img src={url} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        ) : null}

        <div className={styles.productHero}>
          {images.length > 0 ? (
            <img
              src={images[safeIndex]}
              alt=""
              className={styles.productHeroImg}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className={styles.productHeroFallback}>
              {item.capsuleSystem && capsuleSystemIcon(item.capsuleSystem) ? (
                <img src={capsuleSystemIcon(item.capsuleSystem)!} alt="" />
              ) : (
                <span>{item.iconEmoji ?? categoryEmoji(item.category)}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.productBody}>
        <div className={styles.productTitleRow}>
          <div className={styles.productTitleBlock}>
            {item.brand ? <p className={styles.productBrand}>{item.brand.toUpperCase()}</p> : null}
            <h2 className={styles.productTitle}>{item.name}</h2>
            {item.flavorNotes ? <p className={styles.productFlavor}>{item.flavorNotes}</p> : null}
          </div>
          {item.intensity != null ? (
            <div className={styles.intensityBadge} aria-label={`Intensidade ${item.intensity}`}>
              <span className={styles.intensityLabel}>Intensidade</span>
              <strong className={styles.intensityValue}>{item.intensity}</strong>
              {intensityText ? <span className={styles.intensityHint}>{intensityText}</span> : null}
            </div>
          ) : null}
        </div>

        <div className={styles.productSpecs}>
          {item.packSize != null ? (
            <div className={styles.specCard}>
              <span className={styles.specLabel}>Cápsulas</span>
              <strong className={styles.specValue}>×{item.packSize}</strong>
              <span className={styles.specHint}>por caixa</span>
            </div>
          ) : null}
          {cupText ? (
            <div className={styles.specCard}>
              <span className={styles.specLabel}>Tamanho da xícara</span>
              <strong className={styles.specValue}>{cupText}</strong>
            </div>
          ) : null}
          {system ? (
            <div className={styles.specCard}>
              <span className={styles.specLabel}>Sistema</span>
              <strong className={styles.specValue}>
                <img src={system.icon} alt="" className={styles.specIcon} />
                {system.label}
              </strong>
            </div>
          ) : null}
          {item.origin ? (
            <div className={styles.specCard}>
              <span className={styles.specLabel}>Origem</span>
              <strong className={styles.specValue}>{item.origin}</strong>
            </div>
          ) : null}
        </div>

        <div className={`${styles.stockPanel} ${outOfStock ? styles.stockPanelOut : ''}`}>
          <div>
            <p className={styles.stockPanelLabel}>No seu catálogo</p>
            <p className={styles.stockPanelValue}>
              {outOfStock ? 'Acabou' : `${item.quantity} ${item.quantity === 1 ? 'unidade' : 'unidades'}`}
            </p>
          </div>
          <button type="button" className={styles.goldBtn} onClick={onToggleQuantity}>
            {outOfStock ? 'Tenho de novo' : 'Marcar acabou'}
          </button>
        </div>

        {priceText ? (
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>Preço de referência</span>
            <strong className={styles.priceValue}>{priceText}</strong>
          </div>
        ) : null}

        {item.description ? (
          <section className={styles.productSection}>
            <h3 className={styles.productSectionTitle}>Sobre esta cápsula</h3>
            <p className={styles.productDescription}>{item.description}</p>
          </section>
        ) : null}

        {item.ingredients ? (
          <section className={styles.productSection}>
            <details className={styles.ingredientsDetails} open={Boolean(item.ingredients)}>
              <summary>Ver ingredientes</summary>
              <p className={styles.productIngredients}>{item.ingredients}</p>
            </details>
          </section>
        ) : null}

        {item.notes ? (
          <section className={styles.productSection}>
            <h3 className={styles.productSectionTitle}>Suas notas</h3>
            <p className={styles.productNotes}>{item.notes}</p>
          </section>
        ) : null}

        {item.catalogUrl ? (
          <a
            href={item.catalogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.catalogLink}
          >
            Ver no site do fabricante →
          </a>
        ) : null}
      </div>
    </div>
  );
}
