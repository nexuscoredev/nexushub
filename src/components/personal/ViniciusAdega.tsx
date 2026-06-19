import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { AdegaSearchResult } from '../../lib/adegaSearch';
import {
  ADEGA_CATEGORY_PRESETS,
  adegaStats,
  categoryEmoji,
  createAdegaItemId,
  formatVolume,
  loadAdegaItems,
  normalizeAdegaInput,
  saveAdegaItems,
  type AdegaItem,
  type AdegaItemInput,
} from '../../lib/viniciusAdega';
import { AdegaProductSearch } from './AdegaProductSearch';
import styles from './ViniciusAdega.module.css';

type FormState = {
  name: string;
  category: string;
  customCategory: string;
  brand: string;
  quantity: string;
  volumeMl: string;
  abv: string;
  origin: string;
  notes: string;
  opened: boolean;
  imageUrl: string;
  barcode: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  category: ADEGA_CATEGORY_PRESETS[0],
  customCategory: '',
  brand: '',
  quantity: '1',
  volumeMl: '750',
  abv: '',
  origin: '',
  notes: '',
  opened: false,
  imageUrl: '',
  barcode: '',
};

function itemToForm(item: AdegaItem): FormState {
  const preset = ADEGA_CATEGORY_PRESETS.includes(item.category as (typeof ADEGA_CATEGORY_PRESETS)[number]);
  return {
    name: item.name,
    category: preset ? item.category : 'Outro',
    customCategory: preset ? '' : item.category,
    brand: item.brand ?? '',
    quantity: String(item.quantity),
    volumeMl: item.volumeMl != null ? String(item.volumeMl) : '',
    abv: item.abv != null ? String(item.abv) : '',
    origin: item.origin ?? '',
    notes: item.notes ?? '',
    opened: Boolean(item.opened),
    imageUrl: item.imageUrl ?? '',
    barcode: item.barcode ?? '',
  };
}

function formToInput(form: FormState): AdegaItemInput {
  const category = form.category === 'Outro' ? form.customCategory : form.category;
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
    barcode: form.barcode || undefined,
  };
}

function applySearchResult(form: FormState, hit: AdegaSearchResult): FormState {
  const preset = ADEGA_CATEGORY_PRESETS.includes(hit.category as (typeof ADEGA_CATEGORY_PRESETS)[number]);
  return {
    ...form,
    name: hit.name,
    brand: hit.brand ?? '',
    category: preset ? hit.category : 'Outro',
    customCategory: preset ? form.customCategory : hit.category !== 'Outro' ? hit.category : form.customCategory,
    volumeMl: hit.volumeMl != null ? String(hit.volumeMl) : form.volumeMl,
    abv: hit.abv != null ? String(hit.abv) : form.abv,
    origin: hit.origin ?? form.origin,
    imageUrl: hit.imageUrl ?? '',
    barcode: hit.barcode,
  };
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
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

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

  const persist = (next: AdegaItem[]) => {
    setItems(next);
    if (userId) saveAdegaItems(userId, next);
  };

  const stats = useMemo(() => adegaStats(items), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (!q) return true;
      const haystack = [item.name, item.category, item.brand, item.origin, item.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search, categoryFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (item: AdegaItem) => {
    setViewingItem(null);
    setEditingId(item.id);
    setForm(itemToForm(item));
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
    const normalized = normalizeAdegaInput(formToInput(form));
    if (!normalized) {
      setFormError('Informe nome e categoria.');
      return;
    }

    const now = new Date().toISOString();

    if (editingId) {
      persist(
        items.map((item) =>
          item.id === editingId
            ? { ...item, ...normalized, updatedAt: now }
            : item,
        ),
      );
    } else {
      persist([
        ...items,
        {
          id: createAdegaItemId(),
          ...normalized,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    closeDialog();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Remover este item da adega?')) return;
    persist(items.filter((item) => item.id !== id));
  };

  const handleCatalogPick = useCallback((hit: AdegaSearchResult) => {
    setForm((prev) => applySearchResult(prev, hit));
    setFormError(null);
  }, []);

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
        <p className={styles.bannerEyebrow}>Só seu · coleção</p>
        <h2 className={styles.bannerTitle}>Minha adega</h2>
        <p className={styles.bannerLead}>
          Whisky, vinhos, cervejas e qualquer bebida — tudo num lugar só.
        </p>
        {stats.totalItems > 0 ? (
          <div className={styles.stats}>
            <span className={styles.stat}>{stats.totalItems} itens</span>
            <span className={styles.stat}>{stats.totalBottles} garrafas</span>
            <span className={styles.stat}>{stats.categories.length} categorias</span>
          </div>
        ) : null}
      </header>

      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.search}
          placeholder="Buscar…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar na adega"
          enterKeyHint="search"
        />
        {editing ? (
          <button type="button" className={`${styles.addBtn} ${styles.toolbarAddBtn}`} onClick={openCreate}>
            + Adicionar
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

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {items.length === 0 ? 'Adega vazia' : 'Nenhum item encontrado'}
          </p>
          <p className={styles.emptyText}>
            {items.length === 0
              ? 'Comece adicionando um whisky, vinho ou qualquer bebida da sua coleção.'
              : 'Tente outro termo ou remova o filtro de categoria.'}
          </p>
          {items.length === 0 && editing ? (
            <button type="button" className={styles.emptyBtn} onClick={openCreate}>
              Adicionar primeiro item
            </button>
          ) : items.length === 0 ? (
            <button type="button" className={styles.emptyBtn} onClick={() => setEditMode(true)}>
              Editar adega
            </button>
          ) : null}
        </div>
      ) : (
        <ul className={styles.list}>
          {filtered.map((item) => {
            const volume = formatVolume(item.volumeMl);
            return (
              <li key={item.id} className={`${styles.card} ${editing ? styles.cardEditing : ''}`}>
                <button
                  type="button"
                  className={styles.cardTap}
                  onClick={() => handleCardClick(item)}
                  aria-label={editing ? `Editar ${item.name}` : `Ver ${item.name}`}
                >
                  <span className={styles.cardIcon} aria-hidden>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className={styles.cardPhoto} loading="lazy" decoding="async" />
                    ) : (
                      categoryEmoji(item.category)
                    )}
                  </span>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{item.name}</h3>
                    <p className={styles.cardMeta}>
                      {[item.brand, item.category].filter(Boolean).join(' · ')}
                      {item.quantity > 1 ? ` · ${item.quantity} un.` : null}
                    </p>
                    <div className={styles.cardTags}>
                      {volume ? <span className={styles.tag}>{volume}</span> : null}
                      {item.abv != null ? <span className={styles.tag}>{item.abv}% vol.</span> : null}
                      {item.origin ? <span className={styles.tag}>{item.origin}</span> : null}
                      {item.opened ? <span className={`${styles.tag} ${styles.tagOpened}`}>Aberta</span> : null}
                    </div>
                    {!editing && item.notes ? <p className={styles.cardNotes}>{item.notes}</p> : null}
                  </div>
                  {!editing ? (
                    <span className={styles.cardArrow} aria-hidden>
                      →
                    </span>
                  ) : null}
                </button>
                {editing ? (
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => openEdit(item)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={() => handleDelete(item.id)}
                    >
                      Remover
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <button
          type="button"
          className={styles.fab}
          onClick={openCreate}
          aria-label="Adicionar item à adega"
        >
          +
        </button>
      ) : null}

      {viewingItem ? (
        <div className={styles.overlay} role="presentation" onClick={() => setViewingItem(null)}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="adega-view-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.dialogHead}>
              <div className={styles.dialogHandle} aria-hidden />
              <div className={styles.dialogHeadRow}>
                <h3 id="adega-view-title" className={styles.dialogTitle}>
                  {viewingItem.name}
                </h3>
                <button
                  type="button"
                  className={styles.dialogClose}
                  onClick={() => setViewingItem(null)}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
            </div>
            <div className={styles.viewBody}>
              <div className={styles.viewHero}>
                {viewingItem.imageUrl ? (
                  <img
                    src={viewingItem.imageUrl}
                    alt=""
                    className={styles.viewPhoto}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className={styles.viewEmoji} aria-hidden>
                    {categoryEmoji(viewingItem.category)}
                  </span>
                )}
              </div>
              <dl className={styles.viewMeta}>
                {viewingItem.brand ? (
                  <>
                    <dt>Marca</dt>
                    <dd>{viewingItem.brand}</dd>
                  </>
                ) : null}
                <dt>Categoria</dt>
                <dd>{viewingItem.category}</dd>
                <dt>Quantidade</dt>
                <dd>{viewingItem.quantity}</dd>
                {formatVolume(viewingItem.volumeMl) ? (
                  <>
                    <dt>Volume</dt>
                    <dd>{formatVolume(viewingItem.volumeMl)}</dd>
                  </>
                ) : null}
                {viewingItem.abv != null ? (
                  <>
                    <dt>Teor alcoólico</dt>
                    <dd>{viewingItem.abv}% vol.</dd>
                  </>
                ) : null}
                {viewingItem.origin ? (
                  <>
                    <dt>Origem</dt>
                    <dd>{viewingItem.origin}</dd>
                  </>
                ) : null}
                <dt>Status</dt>
                <dd>{viewingItem.opened ? 'Garrafa aberta' : 'Fechada'}</dd>
              </dl>
              {viewingItem.notes ? (
                <div className={styles.viewNotes}>
                  <p className={styles.viewNotesLabel}>Notas</p>
                  <p className={styles.viewNotesText}>{viewingItem.notes}</p>
                </div>
              ) : null}
            </div>
            <div className={styles.viewFoot}>
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
                  {editingId ? 'Editar item' : 'Adicionar item'}
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
              {!editingId ? <AdegaProductSearch onSelect={handleCatalogPick} /> : null}

              {form.imageUrl ? (
                <div className={styles.formPreview}>
                  <img src={form.imageUrl} alt="" className={styles.formPreviewImg} loading="lazy" decoding="async" />
                  <button
                    type="button"
                    className={styles.formPreviewClear}
                    onClick={() => setForm((prev) => ({ ...prev, imageUrl: '', barcode: '' }))}
                  >
                    Remover foto
                  </button>
                </div>
              ) : null}

              <div className={styles.field}>
                <label className={styles.label} htmlFor="adega-name">
                  Nome
                </label>
                <input
                  id="adega-name"
                  className={styles.input}
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex.: Lagavulin 16, Malbec Reserva…"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="adega-category">
                  Categoria
                </label>
                <select
                  id="adega-category"
                  className={styles.select}
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                >
                  {ADEGA_CATEGORY_PRESETS.map((category) => (
                    <option key={category} value={category}>
                      {categoryEmoji(category)} {category}
                    </option>
                  ))}
                </select>
              </div>

              {form.category === 'Outro' ? (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="adega-custom-category">
                    Categoria personalizada
                  </label>
                  <input
                    id="adega-custom-category"
                    className={styles.input}
                    value={form.customCategory}
                    onChange={(e) => setForm((prev) => ({ ...prev, customCategory: e.target.value }))}
                    placeholder="Ex.: Sake, Vermute, Energético…"
                    required
                  />
                </div>
              ) : null}

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
              </div>

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

              <div className={styles.field}>
                <label className={styles.label} htmlFor="adega-notes">
                  Notas
                </label>
                <textarea
                  id="adega-notes"
                  className={styles.textarea}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Onde comprou, harmonização, presente…"
                />
              </div>

              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={form.opened}
                  onChange={(e) => setForm((prev) => ({ ...prev, opened: e.target.checked }))}
                />
                Garrafa já aberta
              </label>

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
