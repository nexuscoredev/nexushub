import { useEffect, useRef } from 'react';
import { NavIcon } from './NavIcon';
import styles from './InstallAppModal.module.css';

interface InstallAppModalProps {
  open: boolean;
  mode: 'ios' | 'android' | 'native' | 'installed' | 'unavailable';
  onClose: () => void;
  onInstall: () => void;
  installing?: boolean;
}

export function InstallAppModal({
  open,
  mode,
  onClose,
  onInstall,
  installing = false,
}: InstallAppModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-app-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.head}>
          <div>
            <h2 id="install-app-title" className={styles.title}>
              {mode === 'installed' ? 'App instalado' : 'Baixar o app'}
            </h2>
            <p className={styles.sub}>
              {mode === 'installed'
                ? 'O NEXUS já está na sua tela inicial.'
                : 'Instale o site NEXUS no celular — acesso rápido como app nativo.'}
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <NavIcon name="close" />
          </button>
        </div>

        <div className={styles.appPreview}>
          <img src="/img/favicon.png" alt="" className={styles.appIcon} width={48} height={48} />
          <div>
            <p className={styles.appName}>NEXUS</p>
            <p className={styles.appMeta}>Site · tecnologia sob medida</p>
          </div>
        </div>

        {mode === 'ios' && (
          <ol className={styles.steps}>
            <li className={styles.step}>
              <span className={styles.stepNum}>1</span>
              <span>
                Toque em <strong>Compartilhar</strong> na barra do Safari
              </span>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNum}>2</span>
              <span>
                Escolha <strong>Adicionar à Tela de Início</strong>
              </span>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNum}>3</span>
              <span>
                Confirme em <strong>Adicionar</strong>
              </span>
            </li>
          </ol>
        )}

        {mode === 'android' && (
          <ol className={styles.steps}>
            <li className={styles.step}>
              <span className={styles.stepNum}>1</span>
              <span>
                Toque nos <strong>três pontos</strong> (⋮) no canto do Chrome
              </span>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNum}>2</span>
              <span>
                Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>
              </span>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNum}>3</span>
              <span>
                Confirme em <strong>Instalar</strong>
              </span>
            </li>
          </ol>
        )}

        {mode === 'native' && (
          <p className={styles.sub}>
            Toque em instalar — o navegador baixa o app na sua tela inicial em segundos.
          </p>
        )}

        {mode === 'unavailable' && (
          <p className={styles.sub}>
            Abra no Chrome (Android) ou Safari (iPhone) para instalar o site NEXUS.
          </p>
        )}

        {mode === 'installed' && (
          <p className={styles.installedNote}>Você já pode abrir pelo ícone na home.</p>
        )}

        <div className={styles.actions}>
          {mode === 'native' && (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={onInstall}
              disabled={installing}
            >
              {installing ? 'Instalando…' : 'Instalar app'}
            </button>
          )}
          {mode === 'ios' && (
            <button type="button" className={styles.primaryBtn} onClick={onClose}>
              Entendi
            </button>
          )}
          {mode === 'android' && (
            <button type="button" className={styles.primaryBtn} onClick={onClose}>
              Entendi
            </button>
          )}
          {mode !== 'installed' && (
            <button type="button" className={styles.ghostBtn} onClick={onClose}>
              Agora não
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
