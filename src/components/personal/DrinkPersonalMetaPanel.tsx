import type { DrinkPersonalMeta, DrinkTastingEntry } from '../../lib/viniciusDrinksCartaStore';
import styles from './ViniciusDrinksCarta.module.css';

type DrinkPersonalMetaPanelProps = {
  meta: DrinkPersonalMeta;
  onChange: (patch: Partial<DrinkPersonalMeta>) => void;
  onAddTastingEntry: (entry: { rating: 1 | 2 | 3 | 4 | 5; note: string }) => void;
};

function formatTastingWhen(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function TastingHistoryItem({ entry }: { entry: DrinkTastingEntry }) {
  return (
    <li className={styles.personalMetaHistoryItem}>
      <div className={styles.personalMetaHistoryHead}>
        <time className={styles.personalMetaHistoryWhen} dateTime={entry.createdAt}>
          {formatTastingWhen(entry.createdAt)}
        </time>
        <span className={styles.personalMetaHistoryStars} aria-label={`Nota ${entry.rating} de 5`}>
          {'★'.repeat(entry.rating)}
          <span className={styles.personalMetaHistoryStarsDim}>{'★'.repeat(5 - entry.rating)}</span>
        </span>
      </div>
      <p className={styles.personalMetaHistoryNote}>{entry.note}</p>
    </li>
  );
}

export function DrinkPersonalMetaPanel({
  meta,
  onChange,
  onAddTastingEntry,
}: DrinkPersonalMetaPanelProps) {
  const setRating = (rating: number) => {
    onChange({ rating: meta.rating === rating ? undefined : (rating as 1 | 2 | 3 | 4 | 5) });
  };

  const draftNote = meta.tastingNote ?? '';
  const canAddEntry = meta.rating != null && draftNote.trim().length > 0;
  const history = meta.tastingHistory ?? [];

  const handleAddEntry = () => {
    if (!canAddEntry || meta.rating == null) return;
    onAddTastingEntry({ rating: meta.rating, note: draftNote });
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

      <div className={styles.personalMetaNoteWrap}>
        <span className={styles.personalMetaLabel}>Nota de degustação</span>
        <div className={styles.personalMetaNoteRow}>
          <textarea
            className={styles.personalMetaNote}
            rows={2}
            placeholder="Ficou forte, repetir na festa, usar menos açúcar…"
            value={draftNote}
            onChange={(e) =>
              onChange({ tastingNote: e.target.value === '' ? undefined : e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canAddEntry) {
                e.preventDefault();
                handleAddEntry();
              }
            }}
          />
          <button
            type="button"
            className={styles.personalMetaAddBtn}
            onClick={handleAddEntry}
            disabled={!canAddEntry}
            aria-label="Adicionar ao histórico de degustação"
            title={
              canAddEntry
                ? 'Adicionar ao histórico'
                : 'Selecione uma nota e escreva um comentário'
            }
          >
            +
          </button>
        </div>
      </div>

      {history.length > 0 ? (
        <section className={styles.personalMetaHistory} aria-label="Histórico de degustação">
          <p className={styles.personalMetaHistoryTitle}>Histórico de degustação</p>
          <ol className={styles.personalMetaHistoryList}>
            {history.map((entry) => (
              <TastingHistoryItem key={entry.id} entry={entry} />
            ))}
          </ol>
        </section>
      ) : null}
    </section>
  );
}
