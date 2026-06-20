import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fileToDrinkImageUrl } from '../../lib/drinkCartaImage';
import {
  VINICIUS_DRINKS,
  VINICIUS_DRINKS_BANNER_HEIGHT,
  VINICIUS_DRINKS_BANNER_URL,
  VINICIUS_DRINKS_BANNER_WIDTH,
} from '../../lib/viniciusDrinksCarta';
import {
  clearDrinkOverrideField,
  findResolvedDrink,
  loadDrinkCartaStore,
  resolveDrinks,
  saveDrinkCartaStore,
  updateDrinkOverride,
  type DrinkCartaOverride,
  type DrinkCartaStore,
} from '../../lib/viniciusDrinksCartaStore';
import { DrinkCartaEditor } from './DrinkCartaEditor';
import { DrinkRecipeToolkit } from './DrinkRecipeToolkit';
import styles from './ViniciusDrinksCarta.module.css';

export function ViniciusDrinksCarta() {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeSlug = searchParams.get('drink');
  const editing = searchParams.get('edit') === '1';

  const [store, setStore] = useState<DrinkCartaStore>(() => loadDrinkCartaStore(userId));
  const [editorSlug, setEditorSlug] = useState<string | null>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStore(loadDrinkCartaStore(userId));
  }, [userId]);

  const drinks = useMemo(() => resolveDrinks(store), [store]);
  const activeDrink = useMemo(
    () => findResolvedDrink(activeSlug, store),
    [activeSlug, store],
  );
  const editorDrink = useMemo(
    () => (editorSlug ? findResolvedDrink(editorSlug, store) ?? null : null),
    [editorSlug, store],
  );

  const setEditing = (next: boolean) => {
    const params = new URLSearchParams(searchParams);
    params.set('drinks', '1');
    if (next) params.set('edit', '1');
    else params.delete('edit');
    navigate(`/pessoal?${params.toString()}`, { replace: true });
    if (!next) setEditorSlug(null);
  };

  const openDrink = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('drinks', '1');
    params.set('drink', slug);
    navigate(`/pessoal?${params.toString()}`);
  };

  const backToList = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('drink');
    navigate(`/pessoal?${params.toString()}`);
  };

  const handleSaveDrink = (slug: string, patch: DrinkCartaOverride) => {
    setStore((prev) => {
      const next = updateDrinkOverride(prev, slug, patch);
      if (userId) saveDrinkCartaStore(userId, next);
      return next;
    });
  };

  const handleResetField = (slug: string, field: keyof DrinkCartaOverride) => {
    setStore((prev) => {
      const next = clearDrinkOverrideField(prev, slug, field);
      if (userId) saveDrinkCartaStore(userId, next);
      return next;
    });
  };

  const bannerImage = store.bannerImageUrl ?? VINICIUS_DRINKS_BANNER_URL;

  if (activeDrink) {
    return (
      <div className={styles.carta}>
        <div className={styles.cartaToolbar}>
          <button type="button" className={styles.backLink} onClick={backToList}>
            ← Carta
          </button>
          <div className={styles.cartaToolbarActions}>
            <button
              type="button"
              className={editing ? styles.editModeBtnActive : styles.editModeBtn}
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Concluído' : 'Editar'}
            </button>
            {editing ? (
              <button
                type="button"
                className={styles.editToolbarBtn}
                onClick={() => setEditorSlug(activeDrink.slug)}
              >
                Receita
              </button>
            ) : null}
          </div>
        </div>

        <article className={styles.detail}>
          <div className={styles.detailMedia}>
            <div className={editing ? styles.mediaEditWrap : undefined}>
              <img
                src={activeDrink.imageUrl}
                alt=""
                className={styles.detailPhoto}
                loading="lazy"
                decoding="async"
              />
              {editing ? (
                <button
                  type="button"
                  className={styles.mediaEditBtn}
                  onClick={() => setEditorSlug(activeDrink.slug)}
                  aria-label="Alterar foto do drink"
                >
                  ✎ Foto
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.detailBody}>
            <h2 className={styles.detailTitle}>{activeDrink.title}</h2>
            <p className={styles.detailTagline}>{activeDrink.tagline}</p>

            <DrinkRecipeToolkit key={activeDrink.slug} drink={activeDrink} />
          </div>
        </article>

        <DrinkCartaEditor
          open={editorSlug === activeDrink.slug}
          drink={editorDrink}
          onClose={() => setEditorSlug(null)}
          onSave={handleSaveDrink}
          onResetField={handleResetField}
        />
      </div>
    );
  }

  return (
    <div className={styles.carta}>
      <div className={styles.cartaToolbar}>
        <p className={styles.cartaToolbarHint}>
          {editing
            ? 'Toque em ✎ para editar foto e receita de cada drink.'
            : `${drinks.length} receitas na carta`}
        </p>
        <button
          type="button"
          className={editing ? styles.editModeBtnActive : styles.editModeBtn}
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Concluído' : 'Editar carta'}
        </button>
      </div>

      <header className={styles.banner}>
        <div className={styles.bannerArtWrap}>
          <img
            src={bannerImage}
            alt="Carta de Drinks"
            className={styles.bannerArt}
            width={VINICIUS_DRINKS_BANNER_WIDTH}
            height={VINICIUS_DRINKS_BANNER_HEIGHT}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          {editing ? (
            <div className={styles.bannerEditActions}>
              <button
                type="button"
                className={styles.mediaEditBtn}
                onClick={() => bannerFileRef.current?.click()}
                aria-label="Alterar foto do banner"
              >
                ✎ Banner
              </button>
              {store.bannerImageUrl ? (
                <button
                  type="button"
                  className={styles.mediaResetBtn}
                  onClick={() => {
                    if (!userId) return;
                    setStore((prev) => {
                      const next = { ...prev, bannerImageUrl: undefined };
                      saveDrinkCartaStore(userId, next);
                      return next;
                    });
                  }}
                >
                  Restaurar padrão
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <input
          ref={bannerFileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={styles.editorFileInput}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !userId) return;
            try {
              const url = await fileToDrinkImageUrl(file);
              setStore((prev) => {
                const next = { ...prev, bannerImageUrl: url };
                saveDrinkCartaStore(userId, next);
                return next;
              });
            } catch {
              /* ignore */
            } finally {
              e.target.value = '';
            }
          }}
        />
        <div className={styles.bannerMeta}>
          <span className={styles.bannerPill}>{VINICIUS_DRINKS.length} receitas</span>
          <span className={styles.bannerPill}>Bar digital</span>
        </div>
      </header>

      <ul className={styles.list}>
        {drinks.map((drink) => (
          <li key={drink.slug}>
            {editing ? (
              <div className={`${styles.card} ${styles.cardEditing}`}>
                <button
                  type="button"
                  className={styles.cardEditMedia}
                  onClick={() => setEditorSlug(drink.slug)}
                  aria-label={`Editar ${drink.title}`}
                >
                  <span className={styles.cardMedia}>
                    <img src={drink.imageUrl} alt="" loading="lazy" decoding="async" />
                  </span>
                  <span className={styles.cardEditBadge}>✎</span>
                </button>
                <button
                  type="button"
                  className={styles.cardEditBody}
                  onClick={() => setEditorSlug(drink.slug)}
                >
                  <span className={styles.cardTitle}>{drink.title}</span>
                  <span className={styles.cardTagline}>{drink.tagline}</span>
                </button>
                <button
                  type="button"
                  className={styles.cardPreviewBtn}
                  onClick={() => openDrink(drink.slug)}
                  aria-label={`Ver ${drink.title}`}
                >
                  →
                </button>
              </div>
            ) : (
              <button type="button" className={styles.card} onClick={() => openDrink(drink.slug)}>
                <span className={styles.cardMedia}>
                  <img src={drink.imageUrl} alt="" loading="lazy" decoding="async" />
                </span>
                <span className={styles.cardBody}>
                  <span className={styles.cardTitle}>{drink.title}</span>
                  <span className={styles.cardTagline}>{drink.tagline}</span>
                </span>
                <span className={styles.cardArrow} aria-hidden>
                  →
                </span>
              </button>
            )}
          </li>
        ))}
      </ul>

      <DrinkCartaEditor
        open={Boolean(editorSlug)}
        drink={editorDrink}
        onClose={() => setEditorSlug(null)}
        onSave={handleSaveDrink}
        onResetField={handleResetField}
      />
    </div>
  );
}
