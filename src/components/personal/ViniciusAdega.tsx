import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fileToDrinkImageUrl, parseDrinkImageUrl } from '../../lib/drinkCartaImage';
import { adegaItemGoogleQuery, openGoogleSearch } from '../../lib/googleSearch';
import { AdegaImagePicker } from './AdegaImagePicker';
import { AdegaItemCards } from './AdegaItemCards';
import {
  ADEGA_CATEGORY_PRESETS,
  ADEGA_INGREDIENT_CATEGORY_PRESETS,
  ADEGA_INGREDIENT_UNIT_PRESETS,
  adegaStats,
  categoryEmoji,
  createAdegaItemId,
  filterAdegaBeverages,
  filterAdegaIngredients,
  formatIngredientQuantity,
  formatVolume,
  isAdegaIngredient,
  loadAdegaItems,
  normalizeAdegaInput,
  normalizeIngredientInput,
  saveAdegaItems,
  syncAdegaItemsFromCloud,
  VINICIUS_ADEGA_BANNER_HEIGHT,
  VINICIUS_ADEGA_BANNER_URL,
  VINICIUS_ADEGA_BANNER_WIDTH,
  type AdegaItem,
  type AdegaItemInput,
  type AdegaItemKind,
} from '../../lib/viniciusAdega';
import styles from './ViniciusAdega.module.css';

type FormKind = AdegaItemKind;

type FormState = {
  name: string;
  category: string;
  customCategory: string;
  brand: string;
  quantity: string;
  unit: string;
  volumeMl: string;
  abv: string;
  origin: string;
  notes: string;
  opened: boolean;
  imageUrl: string;
};

const EMPTY_BEVERAGE_FORM: FormState = {
  name: '',
  category: ADEGA_CATEGORY_PRESETS[0],
  customCategory: '',
  brand: '',
  quantity: '1',
  unit: 'un.',
  volumeMl: '750',
  abv: '',
  origin: '',
  notes: '',
  opened: false,
  imageUrl: '',
};

const EMPTY_INGREDIENT_FORM: FormState = {
  name: '',
  category: ADEGA_INGREDIENT_CATEGORY_PRESETS[0],
  customCategory: '',
  brand: '',
  quantity: '1',
  unit: ADEGA_INGREDIENT_UNIT_PRESETS[0],
  volumeMl: '',
  abv: '',
  origin: '',
  notes: '',
  opened: false,
  imageUrl: '',
};

function emptyForm(kind: FormKind): FormState {
  return kind === 'ingredient' ? { ...EMPTY_INGREDIENT_FORM } : { ...EMPTY_BEVERAGE_FORM };
}

function itemToForm(item: AdegaItem): FormState {
  if (isAdegaIngredient(item)) {
    const preset = ADEGA_INGREDIENT_CATEGORY_PRESETS.includes(
      item.category as (typeof ADEGA_INGREDIENT_CATEGORY_PRESETS)[number],
    );
    return {
      name: item.name,
      category: preset ? item.category : 'Outro',
      customCategory: preset ? '' : item.category,
      brand: '',
      quantity: String(item.quantity),
      unit: item.unit ?? ADEGA_INGREDIENT_UNIT_PRESETS[0],
      volumeMl: '',
      abv: '',
      origin: '',
      notes: item.notes ?? '',
      opened: false,
      imageUrl: item.imageUrl ?? '',
    };
  }

  const preset = ADEGA_CATEGORY_PRESETS.includes(item.category as (typeof ADEGA_CATEGORY_PRESETS)[number]);
  return {
    name: item.name,
    category: preset ? item.category : 'Outro',
    customCategory: preset ? '' : item.category,
    brand: item.brand ?? '',
    quantity: String(item.quantity),
    unit: 'un.',
    volumeMl: item.volumeMl != null ? String(item.volumeMl) : '',
    abv: item.abv != null ? String(item.abv) : '',
    origin: item.origin ?? '',
    notes: item.notes ?? '',
    opened: Boolean(item.opened),
    imageUrl: item.imageUrl ?? '',
  };
}

function formToInput(form: FormState, kind: FormKind): AdegaItemInput {
  const category = form.category === 'Outro' ? form.customCategory : form.category;
  if (kind === 'ingredient') {
    return {
      kind: 'ingredient',
      name: form.name,
      category,
      quantity: Number(form.quantity),
      unit: form.unit,
      notes: form.notes || undefined,
      imageUrl: form.imageUrl || undefined,
    };
  }
  return {
    name: form.name,
    category,
    brand: form.brand || undefined,
    quantity: Number(form.quantity),
    volumeMl: form.volumeMl ? Number(form.volumeMl) : undefined,
    abv: form.abv ? Number(form.abv) : undefined,
    origin: form.origin || undefined,
    notes: form.notes || undefined,
    opened: form.opened,
    imageUrl: form.imageUrl || undefined,
  };
}

function imageUrlFieldValue(imageUrl: string): string {
  if (!imageUrl || imageUrl.startsWith('data:')) return '';
  return imageUrl;
}

export function ViniciusAdega() {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editing = searchParams.get('edit') === '1';

  const [items, setItems] = useState<AdegaItem[]>(() => loadAdegaItems(userId));
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<AdegaItem | null>(null);
  const [formKind, setFormKind] = useState<FormKind>('beverage');
  const [form, setForm] = useState<FormState>(EMPTY_BEVERAGE_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [draftItemId, setDraftItemId] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const setEditMode = (next: boolean) => {
    const params = new URLSearchParams(searchParams);
    params.set('adega', '1');
    if (next) params.set('edit', '1');
    else params.delete('edit');
    navigate(`/pessoal?${params.toString()}`, { replace: true });
    if (!next) {
      setDialogOpen(false);
      setEditingId(null);
      setFormError(null);
    }
  };

  useEffect(() => {
    setItems(loadAdegaItems(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void syncAdegaItemsFromCloud(userId).then((cloudItems) => {
      if (cloudItems) setItems(cloudItems);
    });
  }, [userId]);

  const persist = (next: AdegaItem[]) => {
    setItems(next);
    if (userId) saveAdegaItems(userId, next);
  };

  const stats = useMemo(() => adegaStats(items), [items]);

  const beverages = useMemo(() => filterAdegaBeverages(items), [items]);
  const ingredients = useMemo(() => filterAdegaIngredients(items), [items]);

  const filteredBeverages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return beverages.filter((item) => {
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (!q) return true;
      const haystack = [item.name, item.category, item.brand, item.origin, item.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [beverages, search, categoryFilter]);

  const filteredIngredients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ingredients.filter((item) => {
      if (!q) return true;
      const haystack = [item.name, item.category, item.notes, item.unit]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [ingredients, search]);

  const formGoogleQuery = useMemo(
    () =>
      adegaItemGoogleQuery({
        name: form.name,
        brand: form.brand,
        category: form.category === 'Outro' ? form.customCategory : form.category,
      }),
    [form.name, form.brand, form.category, form.customCategory],
  );

  const openCreate = (kind: FormKind = 'beverage') => {
    setFormKind(kind);
    setEditingId(null);
    setDraftItemId(createAdegaItemId());
    setForm(emptyForm(kind));
    setImageUrlInput('');
    setImageError(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (item: AdegaItem) => {
    setViewingItem(null);
    setFormKind(isAdegaIngredient(item) ? 'ingredient' : 'beverage');
    setEditingId(item.id);
    setDraftItemId(null);
    setForm(itemToForm(item));
    setImageUrlInput(imageUrlFieldValue(item.imageUrl ?? ''));
    setImageError(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const openView = (item: AdegaItem) => {
    setViewingItem(item);
  };

  const handleCardClick = (item: AdegaItem) => {
    if (editing) openEdit(item);
    else openView(item);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setDraftItemId(null);
    setImageUrlInput('');
    setImageError(null);
    setFormError(null);
  };

  useEffect(() => {
    if (!dialogOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDialog();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [dialogOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const normalized =
      formKind === 'ingredient'
        ? normalizeIngredientInput(formToInput(form, 'ingredient'))
        : normalizeAdegaInput(formToInput(form, 'beverage'));
    if (!normalized) {
      setFormError(formKind === 'ingredient' ? 'Informe nome e tipo.' : 'Informe nome e categoria.');
      return;
    }

    const now = new Date().toISOString();
    const payload =
      formKind === 'ingredient'
        ? { ...normalized, kind: 'ingredient' as const }
        : normalized;

    if (editingId) {
      persist(
        items.map((item) =>
          item.id === editingId ? { ...item, ...payload, updatedAt: now } : item,
        ),
      );
    } else {
      persist([
        ...items,
        {
          id: draftItemId ?? createAdegaItemId(),
          ...payload,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    closeDialog();
  };

  const handleDelete = (id: string, kind: FormKind = 'beverage') => {
    const label = kind === 'ingredient' ? 'ingrediente' : 'item';
    if (!window.confirm(`Remover este ${label} da adega?`)) return;
    persist(items.filter((item) => item.id !== id));
  };

  const uploadItemId = editingId ?? draftItemId;

  const handlePhotoFile = async (file: File | null) => {
    if (!file) return;
    setImageLoading(true);
    setImageError(null);
    try {
      const url = await fileToDrinkImageUrl(
        file,
        userId && uploadItemId ? { userId, kind: 'adega', slug: uploadItemId } : undefined,
      );
      setForm((prev) => ({ ...prev, imageUrl: url }));
      setImageUrlInput('');
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Não foi possível usar esta foto.');
    } finally {
      setImageLoading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const applyImageUrl = () => {
    const parsed = parseDrinkImageUrl(imageUrlInput);
    if (!parsed) {
      setImageError('URL de imagem inválida.');
      return;
    }
    setForm((prev) => ({ ...prev, imageUrl: parsed }));
    setImageError(null);
  };

  const clearPhoto = () => {
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    setImageUrlInput('');
    setImageError(null);
  };

  useEffect(() => {
    if (!viewingItem) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewingItem(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [viewingItem]);

  return (
    <div className={`${styles.adega} ${editing ? styles.adegaEditing : ''}`}>
      <div className={styles.adegaToolbar}>
        <p className={styles.adegaToolbarHint}>
          {editing
            ? 'Toque em um item para editar ou use + para adicionar.'
            : stats.totalItems > 0
              ? `${stats.totalItems} itens na coleção`
              : 'Sua coleção de bebidas'}
        </p>
        <button
          type="button"
          className={editing ? styles.editModeBtnActive : styles.editModeBtn}
          onClick={() => setEditMode(!editing)}
        >
          {editing ? 'Concluído' : 'Editar adega'}
        </button>
      </div>

      <header className={styles.banner}>
        <div className={styles.bannerArtWrap}>
          <img
            src={VINICIUS_ADEGA_BANNER_URL}
            alt="Adega — estoque particular de bebidas"
            className={styles.bannerArt}
            width={VINICIUS_ADEGA_BANNER_WIDTH}
            height={VINICIUS_ADEGA_BANNER_HEIGHT}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
        {stats.totalItems > 0 ? (
          <div className={styles.bannerMeta}>
            <span className={styles.stat}>{stats.totalItems} itens</span>
            <span className={styles.stat}>{stats.totalBottles} garrafas</span>
            <span className={styles.stat}>{stats.categories.length} categorias</span>
          </div>
        ) : null}
      </header>

      <div className={styles.toolbar}>
        <label className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            className={styles.search}
            placeholder="Buscar bebidas e ingredientes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar na adega"
            enterKeyHint="search"
          />
        </label>
        {editing ? (
          <button type="button" className={`${styles.addBtn} ${styles.toolbarAddBtn}`} onClick={() => openCreate('beverage')}>
            + Bebida
          </button>
        ) : null}
      </div>

      {stats.categories.length > 0 ? (
        <div className={styles.filtersWrap}>
          <div className={styles.filters} role="group" aria-label="Filtrar por categoria">
            <button
              type="button"
              className={`${styles.filterBtn} ${categoryFilter == null ? styles.filterBtnActive : ''}`}
              onClick={() => setCategoryFilter(null)}
            >
              Todas
            </button>
            {stats.categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`${styles.filterBtn} ${categoryFilter === category ? styles.filterBtnActive : ''}`}
                onClick={() => setCategoryFilter(category)}
                title={category}
              >
                <span aria-hidden>{categoryEmoji(category)}</span>
                <span className={styles.filterLabel}>{category}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="adega-beverages-title">
        <div className={styles.sectionHead}>
          <div>
            <h3 id="adega-beverages-title" className={styles.sectionTitle}>
              Bebidas
            </h3>
            <p className={styles.sectionLead}>Garrafas, latas e destilados da sua coleção.</p>
          </div>
        </div>

        <AdegaItemCards
          items={filteredBeverages}
          editing={editing}
          emptyIcon="🍾"
          emptyTitle={beverages.length === 0 ? 'Nenhuma bebida ainda' : 'Nenhuma bebida encontrada'}
          emptyText={
            beverages.length === 0
              ? 'Comece adicionando um whisky, vinho ou qualquer bebida da sua coleção.'
              : 'Tente outro termo ou remova o filtro de categoria.'
          }
          emptyAction={
            beverages.length === 0 && editing
              ? { label: 'Adicionar bebida', onClick: () => openCreate('beverage') }
              : beverages.length === 0
                ? { label: 'Editar adega', onClick: () => setEditMode(true) }
                : undefined
          }
          onCardClick={handleCardClick}
          onEdit={openEdit}
          onDelete={(id) => handleDelete(id, 'beverage')}
        />
      </section>

      <section className={`${styles.section} ${styles.sectionIngredients}`} aria-labelledby="adega-ingredients-title">
        <div className={styles.sectionHead}>
          <div>
            <h3 id="adega-ingredients-title" className={styles.sectionTitle}>
              Ingredientes
            </h3>
            <p className={styles.sectionLead}>
              Limão, hortelã, xaropes e tudo que você usa nos drinks.
              {stats.totalIngredients > 0 ? ` · ${stats.totalIngredients} itens` : ''}
            </p>
          </div>
          {editing ? (
            <button type="button" className={styles.sectionAddBtn} onClick={() => openCreate('ingredient')}>
              + Ingrediente
            </button>
          ) : null}
        </div>

        <AdegaItemCards
          items={filteredIngredients}
          editing={editing}
          compact
          emptyIcon="🍋"
          emptyTitle={ingredients.length === 0 ? 'Despensa vazia' : 'Nenhum ingrediente encontrado'}
          emptyText={
            ingredients.length === 0
              ? 'Cadastre frutas, ervas, mixers e outros itens que você tem em casa.'
              : 'Tente outro termo na busca.'
          }
          emptyAction={
            ingredients.length === 0 && editing
              ? { label: 'Adicionar ingrediente', onClick: () => openCreate('ingredient') }
              : ingredients.length === 0
                ? { label: 'Editar adega', onClick: () => setEditMode(true) }
                : undefined
          }
          onCardClick={handleCardClick}
          onEdit={openEdit}
          onDelete={(id) => handleDelete(id, 'ingredient')}
        />
      </section>

      {editing ? (
        <button
          type="button"
          className={styles.fab}
          onClick={() => openCreate('beverage')}
          aria-label="Adicionar bebida à adega"
        >
          +
        </button>
      ) : null}

      {viewingItem ? (
        <div className={styles.overlay} role="presentation" onClick={() => setViewingItem(null)}>
          <div
            className={`${styles.dialog} ${styles.dialogView}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="adega-view-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.viewCloseFloating}
              onClick={() => setViewingItem(null)}
              aria-label="Fechar"
            >
              ×
            </button>
            <div className={styles.viewHeroPremium}>
              {viewingItem.imageUrl ? (
                <img
                  src={viewingItem.imageUrl}
                  alt=""
                  className={styles.viewPhotoPremium}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className={styles.viewEmojiPremium} aria-hidden>
                  {categoryEmoji(viewingItem.category)}
                </span>
              )}
              <div className={styles.viewHeroScrim} aria-hidden />
              <div className={styles.viewHeroCaption}>
                <span className={styles.viewCategoryPill}>
                  <span aria-hidden>{categoryEmoji(viewingItem.category)}</span>
                  {viewingItem.category}
                </span>
                <h3 id="adega-view-title" className={styles.viewHeroTitle}>
                  {viewingItem.name}
                </h3>
                {viewingItem.brand ? <p className={styles.viewHeroBrand}>{viewingItem.brand}</p> : null}
              </div>
            </div>
            <div className={styles.viewBody}>
              <dl className={styles.viewSpecGrid}>
                <div className={styles.viewSpecItem}>
                  <dt>Quantidade</dt>
                  <dd>
                    {isAdegaIngredient(viewingItem)
                      ? formatIngredientQuantity(viewingItem.quantity, viewingItem.unit)
                      : viewingItem.quantity}
                  </dd>
                </div>
                {!isAdegaIngredient(viewingItem) && formatVolume(viewingItem.volumeMl) ? (
                  <div className={styles.viewSpecItem}>
                    <dt>Volume</dt>
                    <dd>{formatVolume(viewingItem.volumeMl)}</dd>
                  </div>
                ) : null}
                {!isAdegaIngredient(viewingItem) && viewingItem.abv != null ? (
                  <div className={styles.viewSpecItem}>
                    <dt>Teor alcoólico</dt>
                    <dd>{viewingItem.abv}% vol.</dd>
                  </div>
                ) : null}
                {!isAdegaIngredient(viewingItem) && viewingItem.origin ? (
                  <div className={styles.viewSpecItem}>
                    <dt>Origem</dt>
                    <dd>{viewingItem.origin}</dd>
                  </div>
                ) : null}
                {!isAdegaIngredient(viewingItem) ? (
                  <div className={styles.viewSpecItem}>
                    <dt>Status</dt>
                    <dd>{viewingItem.opened ? 'Garrafa aberta' : 'Fechada'}</dd>
                  </div>
                ) : null}
              </dl>
              {viewingItem.notes ? (
                <div className={styles.viewNotes}>
                  <p className={styles.viewNotesLabel}>Notas</p>
                  <p className={styles.viewNotesText}>{viewingItem.notes}</p>
                </div>
              ) : null}
            </div>
            <div className={styles.viewFoot}>
              <button
                type="button"
                className={styles.googleSearchBtn}
                onClick={() =>
                  openGoogleSearch(
                    adegaItemGoogleQuery({
                      name: viewingItem.name,
                      brand: viewingItem.brand,
                      category: viewingItem.category,
                    }),
                  )
                }
              >
                Buscar no Google
              </button>
              <button type="button" className={styles.saveBtn} onClick={() => setViewingItem(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dialogOpen ? (
        <div className={styles.overlay} role="presentation" onClick={closeDialog}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="adega-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.dialogHead}>
              <div className={styles.dialogHandle} aria-hidden />
              <div className={styles.dialogHeadRow}>
                <h3 id="adega-form-title" className={styles.dialogTitle}>
                  {editingId
                    ? formKind === 'ingredient'
                      ? 'Editar ingrediente'
                      : 'Editar item'
                    : formKind === 'ingredient'
                      ? 'Adicionar ingrediente'
                      : 'Adicionar bebida'}
                </h3>
                <button
                  type="button"
                  className={styles.dialogClose}
                  onClick={closeDialog}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.dialogBody}>
              <section className={styles.formPhoto}>
                <p className={styles.label}>Foto</p>
                <div className={styles.formPhotoRow}>
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt=""
                      className={styles.formPhotoPreview}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className={styles.formPhotoFallback} aria-hidden>
                      {formKind === 'ingredient' ? '🍋' : '🍾'}
                    </span>
                  )}
                  <div className={styles.formPhotoActions}>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className={styles.formPhotoInput}
                      onChange={(e) => {
                        void handlePhotoFile(e.target.files?.[0] ?? null);
                      }}
                    />
                    <button
                      type="button"
                      className={styles.formPhotoBtn}
                      disabled={imageLoading}
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {imageLoading ? 'Enviando…' : 'Escolher foto'}
                    </button>
                    <div className={styles.formPhotoUrlRow}>
                      <input
                        type="url"
                        className={styles.input}
                        value={imageUrlInput}
                        onChange={(e) => {
                          setImageUrlInput(e.target.value);
                          setImageError(null);
                        }}
                        placeholder="https://…"
                        inputMode="url"
                      />
                      <button type="button" className={styles.formPhotoApplyBtn} onClick={applyImageUrl}>
                        Usar
                      </button>
                    </div>
                    <p className={styles.formPhotoHint}>.jpg, .png ou .webp — até 10 MB</p>
                    {form.imageUrl ? (
                      <button type="button" className={styles.formPhotoClear} onClick={clearPhoto}>
                        Remover foto
                      </button>
                    ) : null}
                    {imageError ? <p className={styles.formError}>{imageError}</p> : null}
                  </div>
                </div>
              </section>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="adega-name">
                  Nome
                </label>
                <input
                  id="adega-name"
                  className={styles.input}
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={
                    formKind === 'ingredient'
                      ? 'Ex.: Limão, Hortelã, Xarope de gengibre…'
                      : 'Ex.: Lagavulin 16, Malbec Reserva…'
                  }
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="adega-category">
                  {formKind === 'ingredient' ? 'Tipo' : 'Categoria'}
                </label>
                <select
                  id="adega-category"
                  className={styles.select}
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                >
                  {(formKind === 'ingredient' ? ADEGA_INGREDIENT_CATEGORY_PRESETS : ADEGA_CATEGORY_PRESETS).map(
                    (category) => (
                      <option key={category} value={category}>
                        {categoryEmoji(category)} {category}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {form.category === 'Outro' ? (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="adega-custom-category">
                    {formKind === 'ingredient' ? 'Tipo personalizado' : 'Categoria personalizada'}
                  </label>
                  <input
                    id="adega-custom-category"
                    className={styles.input}
                    value={form.customCategory}
                    onChange={(e) => setForm((prev) => ({ ...prev, customCategory: e.target.value }))}
                    placeholder={
                      formKind === 'ingredient' ? 'Ex.: Bitter, Sal, Açúcar…' : 'Ex.: Sake, Vermute, Energético…'
                    }
                    required
                  />
                </div>
              ) : null}

              {formKind === 'beverage' ? (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="adega-brand">
                    Marca / destilaria
                  </label>
                  <input
                    id="adega-brand"
                    className={styles.input}
                    value={form.brand}
                    onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
              ) : null}

              {formKind === 'beverage' ? (
                <AdegaImagePicker
                  query={formGoogleQuery}
                  userId={userId}
                  itemId={uploadItemId}
                  onImageUrl={(url) => {
                    setForm((prev) => ({ ...prev, imageUrl: url }));
                    setImageUrlInput('');
                    setImageError(null);
                  }}
                />
              ) : null}

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="adega-quantity">
                    Quantidade
                  </label>
                  <input
                    id="adega-quantity"
                    type="number"
                    min={0}
                    step={1}
                    className={styles.input}
                    value={form.quantity}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    required
                  />
                </div>
                {formKind === 'ingredient' ? (
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="adega-unit">
                      Unidade
                    </label>
                    <select
                      id="adega-unit"
                      className={styles.select}
                      value={form.unit}
                      onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                    >
                      {ADEGA_INGREDIENT_UNIT_PRESETS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="adega-volume">
                      Volume (ml)
                    </label>
                    <input
                      id="adega-volume"
                      type="number"
                      min={0}
                      step={1}
                      className={styles.input}
                      value={form.volumeMl}
                      onChange={(e) => setForm((prev) => ({ ...prev, volumeMl: e.target.value }))}
                      placeholder="750"
                    />
                  </div>
                )}
              </div>

              {formKind === 'beverage' ? (
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="adega-abv">
                      Teor alcoólico (%)
                    </label>
                    <input
                      id="adega-abv"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      className={styles.input}
                      value={form.abv}
                      onChange={(e) => setForm((prev) => ({ ...prev, abv: e.target.value }))}
                      placeholder="40"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="adega-origin">
                      Origem
                    </label>
                    <input
                      id="adega-origin"
                      className={styles.input}
                      value={form.origin}
                      onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))}
                      placeholder="Escócia, Chile…"
                    />
                  </div>
                </div>
              ) : null}

              <div className={styles.field}>
                <label className={styles.label} htmlFor="adega-notes">
                  Notas
                </label>
                <textarea
                  id="adega-notes"
                  className={styles.textarea}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder={
                    formKind === 'ingredient'
                      ? 'Validade, onde guarda, substitutos…'
                      : 'Onde comprou, harmonização, presente…'
                  }
                />
              </div>

              {formKind === 'beverage' ? (
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={form.opened}
                    onChange={(e) => setForm((prev) => ({ ...prev, opened: e.target.checked }))}
                  />
                  Garrafa já aberta
                </label>
              ) : null}

              {formError ? <p className={styles.formError}>{formError}</p> : null}
              </div>

              <div className={styles.dialogFoot}>
                <button type="button" className={styles.cancelBtn} onClick={closeDialog}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  {editingId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
