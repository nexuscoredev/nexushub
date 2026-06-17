import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  humorEmoji,
  humorMensagem,
  humorRotulo,
  loadHumorDoDia,
  saveHumorDoDia,
} from '../../lib/pessoalHumor';
import { TodoistIcon } from '../TodoistIcon';
import { TheNewsMark } from './TheNewsMark';
import { PiggyFinanceButton } from './PiggyFinanceButton';
import { ViniciusDrinksEntry } from './ViniciusDrinksEntry';
import styles from './PersonalAreaHome.module.css';

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

const QUICK_LINKS = [
  {
    id: 'texto-diario',
    label: 'Texto diário',
    href: 'https://wol.jw.org/pt/wol/h/r5/lp-t',
    materialIcon: 'menu_book',
  },
  {
    id: 'the-news',
    label: 'the news',
    href: 'https://open.spotify.com/show/5cYtKjFwlRCSZKyV6ZC8Wq',
    variant: 'the-news',
  },
  {
    id: 'spotify',
    label: 'Spotify',
    href: 'https://open.spotify.com/',
    icon: '/img/streaming/spotify.png',
  },
  {
    id: 'youtube-music',
    label: 'YouTube Music',
    href: 'https://music.youtube.com/',
    icon: '/img/streaming/youtube-music.png',
  },
  {
    id: 'todoist',
    label: 'Todoist',
    href: 'https://todoist.com/app',
  },
] as const;

function saudacao(nome: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Bom dia, ${nome}`;
  if (h < 18) return `Boa tarde, ${nome}`;
  return `Boa noite, ${nome}`;
}

interface PersonalAreaHomeProps {
  onOpenFinance: () => void;
  onOpenDrinks?: () => void;
}

export function PersonalAreaHome({ onOpenFinance, onOpenDrinks }: PersonalAreaHomeProps) {
  const { profile, user } = useAuth();
  const userId = user?.id;
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
        <p className={styles.eyebrow}>Seu cantinho</p>
        <h2 className={styles.greeting}>{saudacao(firstName)}</h2>
        <p className={styles.lead}>
          Um espaço leve para checar como você está, respirar um pouco e cuidar do que importa.
        </p>
      </section>

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

      <section className={styles.card} aria-labelledby="atalhos-dia">
        <h3 id="atalhos-dia" className={styles.cardTitle}>
          Atalhos do dia
        </h3>
        <p className={styles.cardSub}>Texto diário, trilha sonora ou tarefas — no app que preferir.</p>
        <div className={styles.musicRow}>
          {QUICK_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={
                'variant' in link && link.variant === 'the-news'
                  ? `${styles.musicLink} ${styles.theNewsLink}`
                  : styles.musicLink
              }
            >
              {'variant' in link && link.variant === 'the-news' ? (
                <>
                  <TheNewsMark className={styles.theNewsMark} />
                  <span className={styles.theNewsLabel}>{link.label}</span>
                </>
              ) : 'materialIcon' in link && link.materialIcon ? (
                <span className={`material-symbols-outlined ${styles.materialLogo}`} aria-hidden>
                  {link.materialIcon}
                </span>
              ) : link.id === 'todoist' ? (
                <TodoistIcon className={styles.todoistLogo} />
              ) : 'icon' in link ? (
                <img
                  src={link.icon}
                  alt=""
                  className={styles.musicLogo}
                  width={32}
                  height={32}
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      </section>

      <section className={styles.piggySection}>
        <PiggyFinanceButton onLaunch={onOpenFinance} />
      </section>

      {onOpenDrinks ? <ViniciusDrinksEntry onOpen={onOpenDrinks} /> : null}
    </div>
  );
}
