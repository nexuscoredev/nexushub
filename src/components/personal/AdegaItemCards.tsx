import {
  categoryEmoji,
  formatIngredientQuantity,
  formatVolume,
  hasAdegaItemPhoto,
  isAdegaIngredient,
  resolveAdegaItemDisplayIcon,
  type AdegaItem,
} from '../../lib/viniciusAdega';
import type { AdegaViewMode } from '../../lib/adegaView';
import styles from './ViniciusAdega.module.css';

type AdegaItemCardsProps = {
  items: AdegaItem[];
  editing: boolean;
  viewMode?: AdegaViewMode;
  emptyIcon?: string;
  emptyTitle: string;
  emptyText: string;
  emptyAction?: { label: string; onClick: () => void };
  drinkCountByItemId?: Record<string, number>;
  onCardClick: (item: AdegaItem) => void;
  onEdit: (item: AdegaItem) => void;
  onDelete: (id: string) => void;
};

function ItemThumb({ item }: { item: AdegaItem }) {
  return (
    <span className={styles.cardIcon} aria-hidden>
      <span className={styles.cardIconInner}>
        {hasAdegaItemPhoto(item) ? (
          <img src={item.imageUrl} alt="" className={styles.cardPhoto} loading="lazy" decoding="async" />
        ) : (
          resolveAdegaItemDisplayIcon(item)
        )}
      </span>
    </span>
  );
}

function stockLabel(item: AdegaItem): string {
  if (item.quantity <= 0) return 'Sem estoque';
  if (isAdegaIngredient(item)) return formatIngredientQuantity(item.quantity, item.unit);
  return item.quantity > 1 ? `${item.quantity} un.` : 'Em estoque';
}

function AdegaItemCard({
  item,
  editing,
  viewMode,
  drinkCount,
  onCardClick,
  onEdit,
  onDelete,
}: {
  item: AdegaItem;
  editing: boolean;
  viewMode: AdegaViewMode;
  drinkCount: number;
  onCardClick: (item: AdegaItem) => void;
  onEdit: (item: AdegaItem) => void;
  onDelete: (id: string) => void;
}) {
  const isIngredient = isAdegaIngredient(item);
  const volume = formatVolume(item.volumeMl);
  const outOfStock = item.quantity <= 0;
  const showMeta = viewMode === 'content' || viewMode === 'tiles';
  const showTags = viewMode === 'content' || viewMode === 'tiles';
  const showCategory = viewMode !== 'list' && !viewMode.startsWith('icons-');
  const showChevron = viewMode !== 'tiles' && !viewMode.startsWith('icons-');

  return (
    <li
      className={`${styles.card} ${styles[`cardView_${viewMode}`] ?? ''} ${editing ? styles.cardEditing : ''} ${outOfStock ? styles.cardOutOfStock : ''}`}
    >
      <button
        type="button"
        className={styles.cardTap}
        onClick={() => onCardClick(item)}
        aria-label={editing ? `Editar ${item.name}` : `Ver ${item.name}`}
      >
        <ItemThumb item={item} />
        <div className={styles.cardBody}>
          {showCategory ? (
            <span className={styles.cardCategory}>
              <span aria-hidden>{categoryEmoji(item.category)}</span>
              {item.category}
            </span>
          ) : null}
          <h3 className={styles.cardTitle}>{item.name}</h3>
          {showMeta && isIngredient ? (
            <p className={styles.cardMeta}>{formatIngredientQuantity(item.quantity, item.unit)}</p>
          ) : showMeta && (item.brand || item.quantity > 1) ? (
            <p className={styles.cardMeta}>
              {[item.brand, item.quantity > 1 ? `${item.quantity} un.` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
          {showTags && !isIngredient ? (
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
          ) : showTags && drinkCount > 0 ? (
            <div className={styles.cardTags}>
              <span className={`${styles.tag} ${styles.tagDrinks}`}>
                {drinkCount} {drinkCount === 1 ? 'drink' : 'drinks'}
              </span>
            </div>
          ) : null}
          {showMeta && !editing && item.notes ? <p className={styles.cardNotes}>{item.notes}</p> : null}
        </div>
        {!editing && showChevron ? (
          <span className={styles.cardChevron} aria-hidden>
            →
          </span>
        ) : null}
      </button>
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
}

export function AdegaItemCards({
  items,
  editing,
  viewMode = 'content',
  emptyIcon = '🍾',
  emptyTitle,
  emptyText,
  emptyAction,
  drinkCountByItemId,
  onCardClick,
  onEdit,
  onDelete,
}: AdegaItemCardsProps) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
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

  if (viewMode === 'details' && !editing) {
    return (
      <div className={styles.detailsTable} role="table" aria-label="Itens da adega">
        <div className={styles.detailsHead} role="row">
          <span role="columnheader">Item</span>
          <span role="columnheader" className={styles.detailsColCategory}>
            Categoria
          </span>
          <span role="columnheader" className={styles.detailsColStock}>
            Estoque
          </span>
          <span role="columnheader" className={styles.detailsColDrinks}>
            Drinks
          </span>
        </div>
        <ul className={`${styles.list} ${styles.listView_details}`}>
          {items.map((item) => {
            const drinkCount = drinkCountByItemId?.[item.id] ?? 0;
            return (
              <li key={item.id} role="row">
                <button type="button" className={styles.detailsRow} onClick={() => onCardClick(item)}>
                  <span className={styles.detailsItemCell} role="cell">
                    <span className={styles.detailsThumb}>
                      {hasAdegaItemPhoto(item) ? (
                        <img src={item.imageUrl} alt="" className={styles.cardPhoto} loading="lazy" decoding="async" />
                      ) : (
                        <span className={styles.detailsThumbEmoji}>{resolveAdegaItemDisplayIcon(item)}</span>
                      )}
                    </span>
                    <span className={styles.detailsItemText}>
                      <span className={styles.cardTitle}>{item.name}</span>
                      {item.brand ? <span className={styles.detailsItemMeta}>{item.brand}</span> : null}
                    </span>
                  </span>
                  <span className={styles.detailsColCategory} role="cell">
                    {item.category}
                  </span>
                  <span className={styles.detailsColStock} role="cell">
                    {stockLabel(item)}
                  </span>
                  <span className={styles.detailsColDrinks} role="cell">
                    {drinkCount > 0 ? drinkCount : '—'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const listClass = editing
    ? styles.list
    : `${styles.list} ${styles[`listView_${viewMode}`] ?? ''}`;

  return (
    <ul className={listClass}>
      {items.map((item) => (
        <AdegaItemCard
          key={item.id}
          item={item}
          editing={editing}
          viewMode={viewMode}
          drinkCount={drinkCountByItemId?.[item.id] ?? 0}
          onCardClick={onCardClick}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
