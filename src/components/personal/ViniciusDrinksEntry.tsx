import styles from './ViniciusDrinksEntry.module.css';

interface ViniciusDrinksEntryProps {
  onOpen: () => void;
}

export function ViniciusDrinksEntry({ onOpen }: ViniciusDrinksEntryProps) {
  return (
    <section className={styles.section} aria-labelledby="drinks-carta">
      <button type="button" className={styles.btn} onClick={onOpen}>
        <span className={styles.icon} aria-hidden>
          🍸
        </span>
        <span className={styles.copy}>
          <span id="drinks-carta" className={styles.title}>
            Carta de drinks
          </span>
          <span className={styles.sub}>Suas receitas — só você vê isso aqui.</span>
        </span>
        <span className={styles.arrow} aria-hidden>
          →
        </span>
      </button>
    </section>
  );
}
