import type { AdegaItem } from '../../lib/viniciusAdega';
import styles from './ViniciusAdega.module.css';

type AdegaItemPersonalMetaPanelProps = {
  item: AdegaItem;
  onChange: (patch: {
    personalRating?: number;
    tastingNote?: string;
    triedAt?: string;
  }) => void;
};

export function AdegaItemPersonalMetaPanel({ item, onChange }: AdegaItemPersonalMetaPanelProps) {
  const setRating = (rating: number) => {
    onChange({
      personalRating: item.personalRating === rating ? undefined : rating,
    });
  };

  const toggleTried = () => {
    if (item.triedAt) {
      onChange({ triedAt: undefined });
      return;
    }
    onChange({ triedAt: new Date().toISOString().slice(0, 10) });
  };

  return (
    <section className={styles.viewSectionCard} aria-label="Sua experiência com este item">
      <p className={styles.viewNotesLabel}>Sua avaliação</p>

      <div className={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${styles.ratingStar} ${(item.personalRating ?? 0) >= star ? styles.ratingStarActive : ''}`}
            onClick={() => setRating(star)}
            aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`${styles.personalMetaToggle} ${item.triedAt ? styles.personalMetaToggleActive : ''}`}
        onClick={toggleTried}
      >
        {item.triedAt ? `✓ Provado em ${item.triedAt}` : 'Marcar como provado'}
      </button>

      <label className={styles.personalMetaNoteWrap}>
        <span className={styles.viewNotesLabel}>Nota de degustação</span>
        <textarea
          className={styles.personalMetaNote}
          rows={2}
          placeholder="Doce, encorpado, boa para Negroni…"
          value={item.tastingNote ?? ''}
          onChange={(e) => onChange({ tastingNote: e.target.value })}
        />
      </label>
    </section>
  );
}
