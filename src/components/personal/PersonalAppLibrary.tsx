import { useMemo, useState } from 'react';
import {
  catalogForUser,
  createCustomAppId,
  customAppToDefinition,
  normalizeCustomHref,
  resolveAppById,
  type PersonalCustomApp,
  type ResolvedPersonalApp,
} from '../../lib/personalApps';
import { PersonalAppIcon } from './PersonalAppIcon';
import styles from './PersonalAppLibrary.module.css';

interface PersonalAppLibraryProps {
  open: boolean;
  homeIds: Set<string>;
  customApps: PersonalCustomApp[];
  viniciusOnly: boolean;
  onClose: () => void;
  onAdd: (id: string) => void;
  onAddCustom: (app: PersonalCustomApp) => void;
}

export function PersonalAppLibrary({
  open,
  homeIds,
  customApps,
  viniciusOnly,
  onClose,
  onAdd,
  onAddCustom,
}: PersonalAppLibraryProps) {
  const [label, setLabel] = useState('');
  const [href, setHref] = useState('');
  const [error, setError] = useState<string | null>(null);

  const catalog = useMemo(() => catalogForUser(viniciusOnly), [viniciusOnly]);

  const availableBuiltin = useMemo(
    () => catalog.filter((app) => !homeIds.has(app.id)),
    [catalog, homeIds],
  );

  const availableCustom = useMemo(
    () => customApps.filter((app) => !homeIds.has(app.id)).map(customAppToDefinition),
    [customApps, homeIds],
  );

  if (!open) return null;

  const handleAddCustom = () => {
    const name = label.trim();
    const url = normalizeCustomHref(href);
    if (!name) {
      setError('Dê um nome ao atalho.');
      return;
    }
    if (!url) {
      setError('URL inválida. Use https://…');
      return;
    }
    const app: PersonalCustomApp = { id: createCustomAppId(), label: name, href: url };
    onAddCustom(app);
    setLabel('');
    setHref('');
    setError(null);
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-library-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h4 id="app-library-title" className={styles.title}>
            Adicionar apps
          </h4>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <p className={styles.lead}>Escolha do catálogo ou crie um atalho com URL — como no celular.</p>

        {(availableBuiltin.length > 0 || availableCustom.length > 0) && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Biblioteca</p>
            <ul className={styles.list}>
              {[...availableBuiltin, ...availableCustom].map((app) => (
                <LibraryRow key={app.id} app={app} onAdd={() => onAdd(app.id)} />
              ))}
            </ul>
          </div>
        )}

        {availableBuiltin.length === 0 && availableCustom.length === 0 && (
          <p className={styles.empty}>Todos os apps do catálogo já estão na sua home.</p>
        )}

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Novo atalho</p>
          <div className={styles.form}>
            <label className={styles.field}>
              <span>Nome</span>
              <input
                type="text"
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  setError(null);
                }}
                placeholder="Ex.: Meu projeto"
                maxLength={40}
              />
            </label>
            <label className={styles.field}>
              <span>URL</span>
              <input
                type="url"
                value={href}
                onChange={(e) => {
                  setHref(e.target.value);
                  setError(null);
                }}
                placeholder="https://…"
                inputMode="url"
              />
            </label>
            {error ? <p className={styles.error}>{error}</p> : null}
            <button type="button" className={styles.addCustomBtn} onClick={handleAddCustom}>
              Criar atalho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LibraryRow({ app, onAdd }: { app: ResolvedPersonalApp; onAdd: () => void }) {
  return (
    <li className={styles.row}>
      <span className={styles.rowIcon}>
        <PersonalAppIcon icon={app.icon} label={app.label} />
      </span>
      <span className={styles.rowMeta}>
        <span className={styles.rowTitle}>{app.label}</span>
        {app.subtitle ? <span className={styles.rowSub}>{app.subtitle}</span> : null}
      </span>
      <button type="button" className={styles.addBtn} onClick={onAdd}>
        Adicionar
      </button>
    </li>
  );
}
