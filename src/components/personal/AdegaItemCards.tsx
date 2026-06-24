import {
  categoryEmoji,
  formatIngredientQuantity,
  formatVolume,
  hasAdegaItemPhoto,
  isAdegaIngredient,
  resolveAdegaItemDisplayIcon,
  type AdegaItem,
} from '../../lib/viniciusAdega';
import styles from './ViniciusAdega.module.css';

type AdegaItemCardsProps = {
  items: AdegaItem[];
  editing: boolean;
  compact?: boolean;
  emptyIcon?: string;
  emptyTitle: string;
  emptyText: string;
  emptyAction?: { label: string; onClick: () => void };
  drinkCountByItemId?: Record<string, number>;
  onCardClick: (item: AdegaItem) => void;
  onEdit: (item: AdegaItem) => void;
  onDelete: (id: string) => void;
  onToggleStock?: (item: AdegaItem) => void;
};

export function AdegaItemCards({
  items,
  editing,
  compact = false,
  emptyIcon = '🍾',
  emptyTitle,
  emptyText,
  emptyAction,
  drinkCountByItemId,
  onCardClick,
  onEdit,
  onDelete,
  onToggleStock,
}: AdegaItemCardsProps) {
  if (items.length === 0) {
    return (
      <div className={`${styles.empty} ${compact ? styles.emptyCompact : ''}`}>
        <span className={styles.emptyIcon} aria-hidden>
          {emptyIcon}
        </span>
        <p className={styles.emptyTitle}>{emptyTitle}</p>
        <p className={styles.emptyText}>{emptyText}</p>
        {emptyAction ? (
          <button type="button" className={styles.emptyBtn} onClick={emptyAction.onClick}>
            {emptyAction.label}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <ul className={`${styles.list} ${compact ? styles.listCompact : ''}`}>
      {items.map((item) => {
        const isIngredient = isAdegaIngredient(item);
        const volume = formatVolume(item.volumeMl);
        const drinkCount = drinkCountByItemId?.[item.id] ?? 0;
        const outOfStock = item.quantity <= 0;
        return (
          <li
            key={item.id}
            className={`${styles.card} ${compact ? styles.cardCompact : ''} ${editing ? styles.cardEditing : ''} ${outOfStock ? styles.cardOutOfStock : ''}`}
          >
            <button
              type="button"
              className={styles.cardTap}
              onClick={() => onCardClick(item)}
              aria-label={editing ? `Editar ${item.name}` : `Ver ${item.name}`}
            >
              <span className={styles.cardIcon} aria-hidden>
                <span className={styles.cardIconInner}>
                  {hasAdegaItemPhoto(item) ? (
                    <img src={item.imageUrl} alt="" className={styles.cardPhoto} loading="lazy" decoding="async" />
                  ) : (
                    resolveAdegaItemDisplayIcon(item)
                  )}
                </span>
              </span>
              <div className={styles.cardBody}>
                <span className={styles.cardCategory}>
                  <span aria-hidden>{categoryEmoji(item.category)}</span>
                  {item.category}
                </span>
                <h3 className={styles.cardTitle}>{item.name}</h3>
                {isIngredient ? (
                  <p className={styles.cardMeta}>{formatIngredientQuantity(item.quantity, item.unit)}</p>
                ) : item.brand || item.quantity > 1 ? (
                  <p className={styles.cardMeta}>
                    {[item.brand, item.quantity > 1 ? `${item.quantity} un.` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                ) : null}
                {!isIngredient ? (
                  <div className={styles.cardTags}>
                    {volume ? <span className={styles.tag}>{volume}</span> : null}
                    {item.abv != null ? <span className={styles.tag}>{item.abv}% vol.</span> : null}
                    {item.origin ? <span className={styles.tag}>{item.origin}</span> : null}
                    {item.opened ? <span className={`${styles.tag} ${styles.tagOpened}`}>Aberta</span> : null}
                    {drinkCount > 0 ? (
                      <span className={`${styles.tag} ${styles.tagDrinks}`}>
                        {drinkCount} {drinkCount === 1 ? 'drink' : 'drinks'}
                      </span>
                    ) : null}
                  </div>
                ) : drinkCount > 0 ? (
                  <div className={styles.cardTags}>
                    <span className={`${styles.tag} ${styles.tagDrinks}`}>
                      {drinkCount} {drinkCount === 1 ? 'drink' : 'drinks'}
                    </span>
                  </div>
                ) : null}
                {!editing && item.notes ? <p className={styles.cardNotes}>{item.notes}</p> : null}
              </div>
              {!editing ? (
                <span className={styles.cardChevron} aria-hidden>
                  →
                </span>
              ) : null}
            </button>
            {!editing && onToggleStock ? (
              <button
                type="button"
                className={styles.stockToggleBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStock(item);
                }}
                aria-label={outOfStock ? `Repor estoque de ${item.name}` : `Marcar ${item.name} como sem estoque`}
              >
                {outOfStock ? 'Repor' : 'Sem estoque'}
              </button>
            ) : null}
            {editing ? (
              <div className={styles.cardActions}>
                <button type="button" className={styles.actionBtn} onClick={() => onEdit(item)}>
                  Editar
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={() => onDelete(item.id)}
                >
                  Remover
                </button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
