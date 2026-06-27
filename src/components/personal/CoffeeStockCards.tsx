import { categoryEmoji } from '../../lib/viniciusCoffeeStock';
import type { CoffeeStockItem } from '../../lib/viniciusCoffeeStock';
import type { CoffeeStockViewMode } from '../../lib/coffeeStockView';
import styles from './ViniciusAdega.module.css';

type CoffeeStockCardsProps = {
  items: CoffeeStockItem[];
  editing: boolean;
  viewMode: CoffeeStockViewMode;
  emptyTitle: string;
  emptyText: string;
  onCardClick: (item: CoffeeStockItem) => void;
  onEdit: (item: CoffeeStockItem) => void;
  onDelete: (id: string) => void;
  onToggleQuantity: (id: string) => void;
};

function ItemThumb({ item }: { item: CoffeeStockItem }) {
  return (
    <span className={styles.cardIcon} aria-hidden>
      <span className={styles.cardIconInner}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className={styles.cardPhoto} loading="lazy" decoding="async" />
        ) : (
          item.iconEmoji ?? categoryEmoji(item.category)
        )}
      </span>
    </span>
  );
}

function CoffeeStockCard({
  item,
  editing,
  viewMode,
  onCardClick,
  onEdit,
  onDelete,
  onToggleQuantity,
}: {
  item: CoffeeStockItem;
  editing: boolean;
  viewMode: CoffeeStockViewMode;
  onCardClick: (item: CoffeeStockItem) => void;
  onEdit: (item: CoffeeStockItem) => void;
  onDelete: (id: string) => void;
  onToggleQuantity: (id: string) => void;
}) {
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
        onClick={() => (editing ? onEdit(item) : onCardClick(item))}
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
          {showMeta ? (
            <p className={styles.cardMeta}>
              {[item.brand, item.intensity != null ? `Int. ${item.intensity}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
          {showTags ? (
            <div className={styles.cardTags}>
              <span className={`${styles.tag} ${outOfStock ? styles.tagOpened : ''}`}>
                {outOfStock ? 'Acabou' : `${item.quantity} un.`}
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
      ) : (
        <div className={styles.cardActions}>
          <button type="button" className={styles.actionBtn} onClick={() => onToggleQuantity(item.id)}>
            {outOfStock ? 'Tenho de novo' : 'Marcar acabou'}
          </button>
        </div>
      )}
    </li>
  );
}

export function CoffeeStockCards({
  items,
  editing,
  viewMode,
  emptyTitle,
  emptyText,
  onCardClick,
  onEdit,
  onDelete,
  onToggleQuantity,
}: CoffeeStockCardsProps) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon} aria-hidden>
          ☕
        </span>
        <p className={styles.emptyTitle}>{emptyTitle}</p>
        <p className={styles.emptyText}>{emptyText}</p>
      </div>
    );
  }

  if (viewMode === 'details' && !editing) {
    return (
      <div className={styles.detailsTable} role="table" aria-label="Minhas cápsulas">
        <div className={styles.detailsHead} role="row">
          <span role="columnheader">Cápsula</span>
          <span role="columnheader" className={styles.detailsColCategory}>
            Sistema
          </span>
          <span role="columnheader" className={styles.detailsColStock}>
            Quantidade
          </span>
        </div>
        <ul className={`${styles.list} ${styles.listView_details}`}>
          {items.map((item) => (
            <li key={item.id} role="row">
              <button type="button" className={styles.detailsRow} onClick={() => onCardClick(item)}>
                <span className={styles.detailsItemCell} role="cell">
                  <span className={styles.detailsThumb}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className={styles.cardPhoto} loading="lazy" decoding="async" />
                    ) : (
                      <span className={styles.detailsThumbEmoji}>{categoryEmoji(item.category)}</span>
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
                  {item.quantity > 0 ? `${item.quantity} un.` : 'Acabou'}
                </span>
              </button>
            </li>
          ))}
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
        <CoffeeStockCard
          key={item.id}
          item={item}
          editing={editing}
          viewMode={viewMode}
          onCardClick={onCardClick}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleQuantity={onToggleQuantity}
        />
      ))}
    </ul>
  );
}
