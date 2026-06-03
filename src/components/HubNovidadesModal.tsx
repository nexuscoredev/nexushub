import { useEffect } from 'react';
import { useAppUpdateContext } from '../contexts/AppUpdateContext';
import { HUB_NOVIDADES, markNovidadesSeen } from '../data/hubNovidades';
import { NavIcon } from './NavIcon';
import styles from './HubNovidadesModal.module.css';

interface HubNovidadesModalProps {
  open: boolean;
  onClose: () => void;
}

export function HubNovidadesModal({ open, onClose }: HubNovidadesModalProps) {
  const { updateAvailable, applyUpdate } = useAppUpdateContext();

  useEffect(() => {
    if (!open) return;
    markNovidadesSeen();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hub-novidades-title"
      >
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 id="hub-novidades-title" className={styles.title}>
              Novidades do Hub
            </h2>
            <p className={styles.subtitle}>
              O que mudou recentemente no NEXUS Hub — Fila, Financeiro, mobile e integração Todoist.
            </p>
          </div>
          <button
            type="button"
            className={`btn-ghost ${styles.closeBtn}`}
            onClick={onClose}
            aria-label="Fechar novidades"
          >
            <NavIcon name="close" />
          </button>
        </div>

        <div className={styles.scroll}>
          {HUB_NOVIDADES.map((release) => (
            <section key={release.id} className={styles.release}>
              <div className={styles.releaseHead}>
                <span className={styles.releaseDate}>{release.dateLabel}</span>
                <h3 className={styles.releaseTitle}>{release.title}</h3>
              </div>
              <ul className={styles.list}>
                {release.items.map((item) => (
                  <li key={item.title} className={styles.item}>
                    <div className={styles.itemHead}>
                      {item.area && <span className={styles.areaTag}>{item.area}</span>}
                      <span className={styles.itemTitle}>{item.title}</span>
                    </div>
                    <p className={styles.itemDesc}>{item.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className={styles.footer}>
          {updateAvailable ? (
            <>
              <button type="button" className="btn-ghost" onClick={onClose}>
                Depois
              </button>
              <button type="button" className="btn-primary" onClick={applyUpdate}>
                Atualizar agora
              </button>
            </>
          ) : (
            <button type="button" className="btn-primary" onClick={onClose}>
              Entendi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
