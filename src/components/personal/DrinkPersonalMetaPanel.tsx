import type { DrinkPersonalMeta } from '../../lib/viniciusDrinksCartaStore';
import styles from './ViniciusDrinksCarta.module.css';

type DrinkPersonalMetaPanelProps = {
  meta: DrinkPersonalMeta;
  onChange: (patch: Partial<DrinkPersonalMeta>) => void;
};

export function DrinkPersonalMetaPanel({ meta, onChange }: DrinkPersonalMetaPanelProps) {
  const setRating = (rating: number) => {
    onChange({ rating: meta.rating === rating ? undefined : (rating as 1 | 2 | 3 | 4 | 5) });
  };

  return (
    <section className={styles.personalMetaPanel} aria-label="Sua experiência com este drink">
      <p className={styles.personalMetaTitle}>Sua experiência</p>

      <div className={styles.personalMetaRow}>
        <span className={styles.personalMetaLabel}>Nota</span>
        <div className={styles.ratingStars} role="group" aria-label="Avaliar drink">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`${styles.ratingStar} ${(meta.rating ?? 0) >= star ? styles.ratingStarActive : ''}`}
              onClick={() => setRating(star)}
              aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
              aria-pressed={(meta.rating ?? 0) >= star}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className={styles.personalMetaToggles}>
        <button
          type="button"
          className={`${styles.personalMetaToggle} ${meta.tried ? styles.personalMetaToggleActive : ''}`}
          onClick={() =>
            onChange({
              tried: !meta.tried,
              wantToTry: meta.tried ? meta.wantToTry : false,
            })
          }
          aria-pressed={Boolean(meta.tried)}
        >
          {meta.tried ? '✓ Já provei' : 'Marcar como provado'}
        </button>
        <button
          type="button"
          className={`${styles.personalMetaToggle} ${meta.wantToTry ? styles.personalMetaToggleActive : ''}`}
          onClick={() => onChange({ wantToTry: !meta.wantToTry, tried: meta.wantToTry ? meta.tried : false })}
          aria-pressed={Boolean(meta.wantToTry)}
        >
          {meta.wantToTry ? '★ Quero experimentar' : 'Quero experimentar'}
        </button>
      </div>

      <label className={styles.personalMetaNoteWrap}>
        <span className={styles.personalMetaLabel}>Nota de degustação</span>
        <textarea
          className={styles.personalMetaNote}
          rows={2}
          placeholder="Ficou forte, repetir na festa, usar menos açúcar…"
          value={meta.tastingNote ?? ''}
          onChange={(e) => onChange({ tastingNote: e.target.value.trim() || undefined })}
        />
      </label>
    </section>
  );
}
