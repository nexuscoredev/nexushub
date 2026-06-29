import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  catalogForUser,
  resolveAppById,
  type PersonalAppIcon,
  type PersonalCustomApp,
  type PersonalInternalAction,
} from '../../lib/personalApps';
import { defaultIconForApp, iconsEqual } from '../../lib/personalAppIconOptions';
import {
  loadPersonalAppLayout,
  savePersonalAppLayout,
  syncPersonalAppLayoutFromCloud,
  type PersonalAppLayout,
} from '../../lib/personalAppLayout';
import { PersonalAppIconPicker } from './PersonalAppIconPicker';
import { PersonalAppLibrary } from './PersonalAppLibrary';
import { PersonalAppTile } from './PersonalAppTile';
import styles from './PersonalAppGrid.module.css';

interface PersonalAppGridProps {
  userId: string | undefined;
  viniciusOnly: boolean;
  onOpenFinance: () => void;
  onOpenVault: () => void;
  onOpenDrinks?: () => void;
  onOpenPcGuide?: () => void;
  onOpenAdega?: () => void;
  onOpenCoffee?: () => void;
}

export function PersonalAppGrid({
  userId,
  viniciusOnly,
  onOpenFinance,
  onOpenVault,
  onOpenDrinks,
  onOpenPcGuide,
  onOpenAdega,
  onOpenCoffee,
}: PersonalAppGridProps) {
  const catalog = useMemo(() => catalogForUser(viniciusOnly), [viniciusOnly]);

  const [layout, setLayout] = useState<PersonalAppLayout>(() =>
    loadPersonalAppLayout(userId, viniciusOnly),
  );
  const [editing, setEditing] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [iconPickerId, setIconPickerId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    setLayout(loadPersonalAppLayout(userId, viniciusOnly));
    setEditing(false);
    setLibraryOpen(false);
    setIconPickerId(null);
  }, [userId, viniciusOnly]);

  useEffect(() => {
    if (!userId) return;
    void syncPersonalAppLayoutFromCloud(userId, viniciusOnly).then((cloudLayout) => {
      if (cloudLayout) setLayout(cloudLayout);
    });
  }, [userId, viniciusOnly]);

  const persist = useCallback(
    (next: PersonalAppLayout) => {
      setLayout(next);
      if (userId) savePersonalAppLayout(userId, next);
    },
    [userId],
  );

  const homeApps = useMemo(
    () =>
      layout.order
        .map((id) => resolveAppById(id, catalog, layout.customApps, layout.iconOverrides))
        .filter((app): app is NonNullable<typeof app> => app != null),
    [layout, catalog],
  );

  const iconPickerApp = useMemo(
    () => (iconPickerId ? homeApps.find((app) => app.id === iconPickerId) ?? null : null),
    [homeApps, iconPickerId],
  );

  const iconPickerDefault = useMemo(() => {
    if (!iconPickerId) return null;
    return defaultIconForApp(iconPickerId, catalog, layout.customApps);
  }, [iconPickerId, catalog, layout.customApps]);

  const homeIds = useMemo(() => new Set(layout.order), [layout.order]);

  const handleInternal = (action: PersonalInternalAction) => {
    if (action === 'finance') onOpenFinance();
    if (action === 'vault') onOpenVault();
    if (action === 'drinks') onOpenDrinks?.();
    if (action === 'pc-guide') onOpenPcGuide?.();
    if (action === 'adega') onOpenAdega?.();
    if (action === 'coffee') onOpenCoffee?.();
  };

  const removeFromHome = (id: string) => {
    const nextOverrides = { ...layout.iconOverrides };
    delete nextOverrides[id];
    persist({
      ...layout,
      order: layout.order.filter((item) => item !== id),
      iconOverrides: nextOverrides,
    });
  };

  const addToHome = (id: string) => {
    if (homeIds.has(id)) return;
    persist({ ...layout, order: [...layout.order, id] });
  };

  const addCustomApp = (app: PersonalCustomApp) => {
    persist({
      order: [...layout.order, app.id],
      customApps: [...layout.customApps.filter((c) => c.id !== app.id), app],
      iconOverrides: layout.iconOverrides,
    });
  };

  const setAppIcon = (appId: string, icon: PersonalAppIcon) => {
    const defaultIcon = defaultIconForApp(appId, catalog, layout.customApps);
    const nextOverrides = { ...layout.iconOverrides };
    if (defaultIcon && iconsEqual(icon, defaultIcon)) {
      delete nextOverrides[appId];
    } else {
      nextOverrides[appId] = icon;
    }
    persist({ ...layout, iconOverrides: nextOverrides });
  };

  const resetAppIcon = (appId: string) => {
    const nextOverrides = { ...layout.iconOverrides };
    delete nextOverrides[appId];
    persist({ ...layout, iconOverrides: nextOverrides });
  };

  const moveApp = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const order = [...layout.order];
    const from = order.indexOf(fromId);
    const to = order.indexOf(toId);
    if (from === -1 || to === -1) return;
    order.splice(from, 1);
    order.splice(to, 0, fromId);
    persist({ ...layout, order });
  };

  const resetLayout = () => {
    const fresh = loadPersonalAppLayout(undefined, viniciusOnly);
    persist(fresh);
  };

  return (
    <>
      <section className={styles.section} aria-labelledby="central-apps">
        <div className={styles.head}>
          <div>
            <h3 id="central-apps" className={styles.title}>
              Central de apps
            </h3>
            <p className={styles.sub}>
              {editing
                ? 'Toque no ícone para alterar. Arraste para reorganizar. Toque em − para remover.'
                : 'Sua home pessoal — toque em Organizar para customizar.'}
            </p>
          </div>
          <div className={styles.headActions}>
            {editing ? (
              <>
                <button
                  type="button"
                  className={styles.headBtn}
                  onClick={() => {
                    setLibraryOpen(true);
                  }}
                >
                  + App
                </button>
                <button
                  type="button"
                  className={`${styles.headBtn} ${styles.headBtnPrimary}`}
                  onClick={() => {
                    setEditing(false);
                    setLibraryOpen(false);
                    setIconPickerId(null);
                  }}
                >
                  Concluído
                </button>
              </>
            ) : (
              <button type="button" className={styles.headBtn} onClick={() => setEditing(true)}>
                Organizar
              </button>
            )}
          </div>
        </div>

        <div className={`${styles.grid} ${editing ? styles.gridEditing : ''}`} role="list">
          {homeApps.map((app) => (
            <PersonalAppTile
              key={app.id}
              app={app}
              editing={editing}
              dragging={dragId === app.id}
              dragOver={dragOverId === app.id && dragId !== app.id}
              onInternal={handleInternal}
              onRemove={() => removeFromHome(app.id)}
              onEditIcon={() => setIconPickerId(app.id)}
              onDragStart={() => setDragId(app.id)}
              onDragEnd={() => {
                setDragId(null);
                setDragOverId(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverId(app.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) moveApp(dragId, app.id);
                setDragId(null);
                setDragOverId(null);
              }}
            />
          ))}

          {editing && (
            <button
              type="button"
              className={`${styles.tile} ${styles.addTile}`}
              onClick={() => setLibraryOpen(true)}
              aria-label="Adicionar app"
            >
              <span className={styles.addIconWrap}>+</span>
              <span className={styles.label}>Adicionar</span>
            </button>
          )}
        </div>

        {editing && (
          <div className={styles.editFooter}>
            <button type="button" className={styles.resetBtn} onClick={resetLayout}>
              Restaurar padrão
            </button>
          </div>
        )}
      </section>

      <PersonalAppLibrary
        open={libraryOpen}
        homeIds={homeIds}
        customApps={layout.customApps}
        viniciusOnly={viniciusOnly}
        onClose={() => setLibraryOpen(false)}
        onAdd={addToHome}
        onAddCustom={addCustomApp}
      />

      <PersonalAppIconPicker
        open={iconPickerId != null}
        app={iconPickerApp}
        defaultIcon={iconPickerDefault}
        userId={userId}
        onClose={() => setIconPickerId(null)}
        onSelect={(icon) => {
          if (iconPickerId) setAppIcon(iconPickerId, icon);
        }}
        onReset={() => {
          if (iconPickerId) resetAppIcon(iconPickerId);
        }}
      />
    </>
  );
}
