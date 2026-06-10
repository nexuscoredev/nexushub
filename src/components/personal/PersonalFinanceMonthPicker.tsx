import {
  currentMonthKey,
  formatMonthLabel,
  isCurrentMonth,
  shiftMonthKey,
} from '../../lib/personalFinanceMonth';
import styles from './PersonalFinanceMonthPicker.module.css';

interface PersonalFinanceMonthPickerProps {
  value: string;
  onChange: (monthKey: string) => void;
}

export function PersonalFinanceMonthPicker({ value, onChange }: PersonalFinanceMonthPickerProps) {
  const isCurrent = isCurrentMonth(value);

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.arrowBtn}
        onClick={() => onChange(shiftMonthKey(value, -1))}
        aria-label="Mês anterior"
      >
        ‹
      </button>

      <div className={styles.center}>
        <label className={styles.label} htmlFor="pf-month-input">
          {formatMonthLabel(value)}
        </label>
        <input
          id="pf-month-input"
          type="month"
          className={styles.monthInput}
          value={value}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          aria-label="Selecionar mês"
        />
        {!isCurrent && (
          <button
            type="button"
            className={styles.todayBtn}
            onClick={() => onChange(currentMonthKey())}
          >
            Mês atual
          </button>
        )}
      </div>

      <button
        type="button"
        className={styles.arrowBtn}
        onClick={() => onChange(shiftMonthKey(value, 1))}
        aria-label="Próximo mês"
      >
        ›
      </button>
    </div>
  );
}
