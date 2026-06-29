import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  humorEmoji,
  humorMensagem,
  humorRotulo,
  loadHumorDoDia,
  saveHumorDoDia,
} from '../../lib/pessoalHumor';
import { isViniciusOnly } from '../../lib/viniciusPersonalFinance';
import { PersonalAppGrid } from './PersonalAppGrid';
import styles from './PersonalAreaHome.module.css';

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function saudacao(nome: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Bom dia, ${nome}`;
  if (h < 18) return `Boa tarde, ${nome}`;
  return `Boa noite, ${nome}`;
}

interface PersonalAreaHomeProps {
  onOpenFinance: () => void;
  onOpenVault: () => void;
  onOpenDrinks?: () => void;
  onOpenPcGuide?: () => void;
  onOpenAdega?: () => void;
  onOpenCoffee?: () => void;
}

export function PersonalAreaHome({
  onOpenFinance,
  onOpenVault,
  onOpenDrinks,
  onOpenPcGuide,
  onOpenAdega,
  onOpenCoffee,
}: PersonalAreaHomeProps) {
  const { profile, user } = useAuth();
  const userId = user?.id;
  const email = profile?.email ?? user?.email;
  const viniciusOnly = isViniciusOnly(email);
  const firstName = profile?.nome?.trim().split(/\s+/)[0] ?? 'você';

  const [savedScore, setSavedScore] = useState<number | null>(() => loadHumorDoDia(userId));
  const [pendingScore, setPendingScore] = useState<number | null>(() => loadHumorDoDia(userId));

  useEffect(() => {
    const loaded = loadHumorDoDia(userId);
    setSavedScore(loaded);
    setPendingScore(loaded);
  }, [userId]);

  const previewScore = pendingScore ?? savedScore;

  const mensagem = useMemo(
    () => (previewScore == null ? null : humorMensagem(previewScore)),
    [previewScore],
  );

  const rotulo = useMemo(
    () => (previewScore == null ? null : humorRotulo(previewScore)),
    [previewScore],
  );

  const hasPendingSave =
    pendingScore != null && userId != null && pendingScore !== savedScore;

  const pickScore = (value: number) => {
    setPendingScore(value);
  };

  const handleSaveHumor = () => {
    if (!userId || pendingScore == null) return;
    saveHumorDoDia(userId, pendingScore);
    setSavedScore(pendingScore);
  };

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Sua central</p>
        <h2 className={styles.greeting}>{saudacao(firstName)}</h2>
        <p className={styles.lead}>
          Humor do dia, apps e finanças — tudo organizado num cantinho só seu.
        </p>
      </section>

      <PersonalAppGrid
        userId={userId}
        viniciusOnly={viniciusOnly}
        onOpenFinance={onOpenFinance}
        onOpenVault={onOpenVault}
        onOpenDrinks={onOpenDrinks}
        onOpenPcGuide={onOpenPcGuide}
        onOpenAdega={onOpenAdega}
        onOpenCoffee={onOpenCoffee}
      />

      <section className={styles.card} aria-labelledby="humor-hoje">
        <h3 id="humor-hoje" className={styles.cardTitle}>
          Como estamos hoje?
        </h3>
        <p className={styles.cardSub}>
          De 0 a 10 — sem julgamento, só um termômetro do dia 🌡️
        </p>

        <div className={styles.scoreRow} role="group" aria-label="Nota de 0 a 10">
          {SCORES.map((n) => (
            <button
              key={n}
              type="button"
              className={`${styles.scoreBtn} ${pendingScore === n ? styles.scoreBtnActive : ''}`}
              onClick={() => pickScore(n)}
              aria-pressed={pendingScore === n}
              aria-label={`Nota ${n}, ${humorRotulo(n)}`}
            >
              <span className={styles.scoreEmoji} aria-hidden>
                {humorEmoji(n)}
              </span>
              <span className={styles.scoreNum} aria-hidden>
                {n}
              </span>
            </button>
          ))}
        </div>

        {previewScore != null && (
          <div className={styles.feedback}>
            <span className={styles.feedbackBadge}>{rotulo}</span>
            <p className={styles.feedbackText}>{mensagem}</p>
          </div>
        )}

        <div className={styles.saveRow}>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSaveHumor}
            disabled={!hasPendingSave}
          >
            Salvar
          </button>
          {savedScore != null && !hasPendingSave && (
            <span className={styles.savedHint}>Humor do dia registrado</span>
          )}
        </div>
      </section>
    </div>
  );
}
