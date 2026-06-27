import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  applyCoffeeDiscoverFilters,
  coffeeStockCategoriesInUse,
  filterCoffeeStockByCategory,
  getCoffeeStockCounts,
  isCapsuleCartaRecipe,
  recipeUsesStock,
  searchCoffeeStock,
  type CoffeeDiscoverFilters,
} from '../../lib/coffeeCartaDiscover';
import {
  loadCoffeeCartaViewMode,
  saveCoffeeCartaViewMode,
  type CoffeeCartaViewMode,
} from '../../lib/coffeeCartaView';
import {
  countRecipesForStockItem,
  getRecipesForStockItem,
  matchCoffeeRecipeToStock,
  matchCoffeeRecipesToStock,
} from '../../lib/coffeeStockMatch';
import {
  loadCoffeeStockViewMode,
  saveCoffeeStockViewMode,
  type CoffeeStockViewMode,
} from '../../lib/coffeeStockView';
import {
  COFFEE_FALLBACK_THUMB,
  VINICIUS_COFFEE_BANNER_HEIGHT,
  VINICIUS_COFFEE_BANNER_URL,
  VINICIUS_COFFEE_BANNER_WIDTH,
  type ViniciusCoffeeRecipe,
} from '../../lib/viniciusCoffeeCarta';
import {
  addCustomCoffeeRecipe,
  createCustomCoffeeSlug,
  findResolvedCoffeeRecipe,
  linesToList,
  listToLines,
  loadCoffeeCartaStore,
  resolveCoffeeRecipes,
  saveCoffeeCartaStore,
  syncCoffeeCartaStoreFromCloud,
  updateCoffeeOverride,
  type CoffeeCartaOverride,
  type CoffeeCartaStore,
} from '../../lib/viniciusCoffeeCartaStore';
import {
  COFFEE_CAPSULE_SYSTEMS,
  COFFEE_STOCK_CATEGORY_PRESETS,
  capsuleSystemIcon,
  categoryEmoji,
  categoryToCapsuleSystem,
  createCoffeeStockId,
  loadCoffeeStock,
  normalizeCoffeeStockInput,
  saveCoffeeStock,
  syncCoffeeStockFromCloud,
  type CoffeeCapsuleSystem,
  type CoffeeStockInput,
  type CoffeeStockItem,
} from '../../lib/viniciusCoffeeStock';
import { useAuth } from '../../contexts/AuthContext';
import { CoffeeCartaDiscoverBar } from './CoffeeCartaDiscoverBar';
import { CoffeeCartaList } from './CoffeeCartaList';
import { CoffeeCartaViewMenu } from './CoffeeCartaViewMenu';
import { CoffeeStockCards } from './CoffeeStockCards';
import { CoffeeStockViewMenu } from './CoffeeStockViewMenu';
import { DrinkThumb } from './DrinkThumb';
import { CoffeeStockPhotoTools } from './CoffeeStockPhotoTools';
import drinkStyles from './ViniciusDrinksCarta.module.css';
import adegaStyles from './ViniciusAdega.module.css';
import styles from './ViniciusCoffee.module.css';

type CoffeeTab = 'carta' | 'estoque';

type StockFormState = {
  name: string;
  category: string;
  customCategory: string;
  brand: string;
  intensity: string;
  quantity: string;
  notes: string;
  imageUrl: string;
  imageUrlInput: string;
};

const EMPTY_STOCK_FORM: StockFormState = {
  name: '',
  category: COFFEE_STOCK_CATEGORY_PRESETS[0],
  customCategory: '',
  brand: '',
  intensity: '',
  quantity: '10',
  notes: '',
  imageUrl: '',
  imageUrlInput: '',
};

export function ViniciusCoffee() {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editing = searchParams.get('edit') === '1';
  const activeSlug = searchParams.get('receita');
  const tabParam = searchParams.get('tab');
  const tab: CoffeeTab = tabParam === 'estoque' ? 'estoque' : 'carta';

  const [store, setStore] = useState<CoffeeCartaStore>(() => loadCoffeeCartaStore(userId));
  const [stock, setStock] = useState<CoffeeStockItem[]>(() => loadCoffeeStock(userId));
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<CoffeeDiscoverFilters>({
    search: '',
    method: null,
    capsuleSystem: null,
    stockMode: 'all',
  });
  const [cartaViewMode, setCartaViewMode] = useState<CoffeeCartaViewMode>(() =>
    loadCoffeeCartaViewMode(userId),
  );
  const [stockViewMode, setStockViewMode] = useState<CoffeeStockViewMode>(() =>
    loadCoffeeStockViewMode(userId),
  );
  const [viewingStockItem, setViewingStockItem] = useState<CoffeeStockItem | null>(null);
  const [editorSlug, setEditorSlug] = useState<string | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState<StockFormState>(EMPTY_STOCK_FORM);
  const [recipeEditorOpen, setRecipeEditorOpen] = useState(false);
  const [newRecipeOpen, setNewRecipeOpen] = useState(false);
  const stockPhotoInputRef = useRef<HTMLInputElement>(null);
  const draftStockIdRef = useRef(createCoffeeStockId());

  useEffect(() => {
    setStore(loadCoffeeCartaStore(userId));
    setStock(loadCoffeeStock(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void syncCoffeeCartaStoreFromCloud(userId).then((cloud) => {
      if (cloud) setStore(cloud);
    });
    void syncCoffeeStockFromCloud(userId).then((cloud) => {
      if (cloud) setStock(cloud);
    });
  }, [userId]);

  const recipes = useMemo(() => resolveCoffeeRecipes(store), [store]);
  const stockMatches = useMemo(() => matchCoffeeRecipesToStock(recipes, stock), [recipes, stock]);
  const stockCounts = useMemo(() => getCoffeeStockCounts(recipes, stock), [recipes, stock]);
  const hasStockDependentRecipes = useMemo(() => recipes.some(recipeUsesStock), [recipes]);
  const hasGroundCoffeeInStock = useMemo(
    () =>
      stock.some(
        (item) => item.quantity > 0 && /grão|grao|moído|moido/i.test(item.category),
      ),
    [stock],
  );

  const visibleRecipes = useMemo(
    () => applyCoffeeDiscoverFilters(recipes, stock, filters),
    [recipes, stock, filters],
  );

  const recipeCountByItemId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of stock) {
      map[item.id] = countRecipesForStockItem(item, recipes);
    }
    return map;
  }, [stock, recipes]);

  const stockCategories = useMemo(() => coffeeStockCategoriesInUse(stock), [stock]);

  const filteredStock = useMemo(() => {
    let list = searchCoffeeStock(stock, stockSearch);
    list = filterCoffeeStockByCategory(list, stockCategoryFilter);
    return list;
  }, [stock, stockSearch, stockCategoryFilter]);

  const editorRecipe = useMemo(
    () => (editorSlug ? findResolvedCoffeeRecipe(editorSlug, store) : null),
    [editorSlug, store],
  );

  const activeRecipe = useMemo(
    () => findResolvedCoffeeRecipe(activeSlug, store),
    [activeSlug, store],
  );
  const activeMatch = useMemo(
    () => (activeRecipe ? matchCoffeeRecipeToStock(activeRecipe, stock) : null),
    [activeRecipe, stock],
  );

  const persistStore = (next: CoffeeCartaStore) => {
    setStore(next);
    if (userId) saveCoffeeCartaStore(userId, next);
  };

  const persistStock = (next: CoffeeStockItem[]) => {
    setStock(next);
    if (userId) saveCoffeeStock(userId, next);
  };

  const setTab = (next: CoffeeTab) => {
    const params = new URLSearchParams(searchParams);
    params.set('coffee', '1');
    params.set('tab', next);
    params.delete('receita');
    navigate(`/pessoal?${params.toString()}`, { replace: true });
  };

  const setEditing = (next: boolean) => {
    const params = new URLSearchParams(searchParams);
    params.set('coffee', '1');
    if (next) params.set('edit', '1');
    else params.delete('edit');
    navigate(`/pessoal?${params.toString()}`, { replace: true });
  };

  const openRecipe = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('coffee', '1');
    params.set('tab', 'carta');
    params.set('receita', slug);
    navigate(`/pessoal?${params.toString()}`);
  };

  const backToCartaList = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('receita');
    navigate(`/pessoal?${params.toString()}`);
  };

  const openStockCreate = () => {
    draftStockIdRef.current = createCoffeeStockId();
    setEditingStockId(null);
    setStockForm(EMPTY_STOCK_FORM);
    setStockDialogOpen(true);
  };

  const openStockEdit = (item: CoffeeStockItem) => {
    const preset = COFFEE_STOCK_CATEGORY_PRESETS.includes(
      item.category as (typeof COFFEE_STOCK_CATEGORY_PRESETS)[number],
    );
    setEditingStockId(item.id);
    setStockForm({
      name: item.name,
      category: preset ? item.category : 'Outro',
      customCategory: preset ? '' : item.category,
      brand: item.brand ?? '',
      intensity: item.intensity != null ? String(item.intensity) : '',
      quantity: String(item.quantity),
      notes: item.notes ?? '',
      imageUrl: item.imageUrl ?? '',
      imageUrlInput: item.imageUrl ?? '',
    });
    setStockDialogOpen(true);
  };

  const handleStockSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!userId) return;
    const category =
      stockForm.category === 'Outro' ? stockForm.customCategory.trim() : stockForm.category;
    const input: CoffeeStockInput = {
      name: stockForm.name,
      category,
      brand: stockForm.brand || undefined,
      intensity: stockForm.intensity ? Number(stockForm.intensity) : undefined,
      quantity: Number(stockForm.quantity),
      notes: stockForm.notes || undefined,
      capsuleSystem: categoryToCapsuleSystem(category),
      imageUrl: stockForm.imageUrl || undefined,
    };
    const normalized = normalizeCoffeeStockInput(input);
    if (!normalized) return;

    const now = new Date().toISOString();
    if (editingStockId) {
      persistStock(
        stock.map((item) =>
          item.id === editingStockId
            ? {
                ...item,
                ...normalized,
                updatedAt: now,
              }
            : item,
        ),
      );
    } else {
      persistStock([
        ...stock,
        {
          id: draftStockIdRef.current,
          ...normalized,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }
    setStockDialogOpen(false);
  };

  const handleDeleteStock = (id: string) => {
    persistStock(stock.filter((item) => item.id !== id));
  };

  const toggleStockQuantity = (id: string) => {
    persistStock(
      stock.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity > 0 ? 0 : 1, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
  };

  const handleCartaViewModeChange = (mode: CoffeeCartaViewMode) => {
    setCartaViewMode(mode);
    if (userId) saveCoffeeCartaViewMode(userId, mode);
  };

  const handleStockViewModeChange = (mode: CoffeeStockViewMode) => {
    setStockViewMode(mode);
    if (userId) saveCoffeeStockViewMode(userId, mode);
  };

  const bannerImage = store.bannerImageUrl ?? VINICIUS_COFFEE_BANNER_URL;

  if (activeRecipe) {
    return (
      <div className={styles.shell}>
        <div className={styles.toolbar}>
          <button type="button" className={styles.backLink} onClick={backToCartaList}>
            ← Carta
          </button>
          {editing ? (
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => {
                setRecipeEditorOpen(true);
              }}
            >
              Editar receita
            </button>
          ) : null}
        </div>
        <article className={styles.detail}>
          <DrinkThumb src={activeRecipe.imageUrl} alt="" className={styles.detailPhoto} />
          <h2 className={styles.detailTitle}>{activeRecipe.title}</h2>
          <p className={styles.detailTagline}>{activeRecipe.tagline}</p>
          {activeRecipe.capsuleSystem ? (
            <div className={styles.systemBadge}>
              <img src={capsuleSystemIcon(activeRecipe.capsuleSystem) ?? ''} alt="" />
              <span>
                {COFFEE_CAPSULE_SYSTEMS.find((s) => s.id === activeRecipe.capsuleSystem)?.label}
              </span>
            </div>
          ) : null}
          {activeRecipe && isCapsuleCartaRecipe(activeRecipe) ? (
            activeMatch?.matches.length ? (
              <div className={styles.matchPanel}>
                <p className={styles.matchTitle}>
                  No seu estoque: {activeMatch.matches.map((m) => m.itemName).join(', ')}
                </p>
              </div>
            ) : null
          ) : activeMatch ? (
            <div className={styles.matchPanel}>
              <p className={styles.matchTitle}>
                {activeMatch.status === 'ready'
                  ? 'Você tem o que precisa no estoque'
                  : `Falta: ${activeMatch.missingLabels.join(', ')}`}
              </p>
            </div>
          ) : null}
          <section className={styles.recipeBlock}>
            <h3>Ingredientes</h3>
            <ul>
              {activeRecipe.ingredients.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className={styles.recipeBlock}>
            <h3>Preparo</h3>
            <ol>
              {activeRecipe.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {activeRecipe.notes ? <p className={styles.recipeNote}>{activeRecipe.notes}</p> : null}
          </section>
        </article>
        {recipeEditorOpen ? (
          <CoffeeRecipeEditor
            recipe={activeRecipe}
            onClose={() => setRecipeEditorOpen(false)}
            onSave={(patch) => {
              persistStore(updateCoffeeOverride(store, activeRecipe.slug, patch));
              setRecipeEditorOpen(false);
            }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.tabBar} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'carta'}
          className={`${styles.tab} ${tab === 'carta' ? styles.tabActive : ''}`}
          onClick={() => setTab('carta')}
        >
          Carta
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'estoque'}
          className={`${styles.tab} ${tab === 'estoque' ? styles.tabActive : ''}`}
          onClick={() => setTab('estoque')}
        >
          Estoque
        </button>
        <button
          type="button"
          className={editing ? styles.editModeActive : styles.editModeBtn}
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Concluído' : 'Editar'}
        </button>
      </div>

      {tab === 'carta' ? (
        <>
          <header className={styles.banner}>
            <img
              src={bannerImage}
              alt="Carta de café"
              width={VINICIUS_COFFEE_BANNER_WIDTH}
              height={VINICIUS_COFFEE_BANNER_HEIGHT}
              className={styles.bannerImg}
            />
            <div className={styles.bannerMeta}>
              <span className={styles.pill}>{recipes.length} receitas</span>
              {stockCounts.ready > 0 ? (
                <span className={styles.pillReady}>{stockCounts.ready} na carta agora</span>
              ) : null}
            </div>
          </header>

          {!editing ? (
            <CoffeeCartaDiscoverBar
              showStockFilters={recipes.length > 0}
              readyCount={stockCounts.ready}
              almostCount={stockCounts.almost}
              filters={filters}
              onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
            />
          ) : null}

          {!editing ? (
            <div className={drinkStyles.cartaViewToolbar}>
              <CoffeeCartaViewMenu viewMode={cartaViewMode} onViewModeChange={handleCartaViewModeChange} />
            </div>
          ) : null}

          {editing ? (
            <div className={styles.filters}>
              <button type="button" className={styles.addBtn} onClick={() => setNewRecipeOpen(true)}>
                + Nova receita
              </button>
            </div>
          ) : null}

          {hasStockDependentRecipes && !hasGroundCoffeeInStock ? (
            <p className={styles.hint}>
              Cápsulas aparecem sempre na carta. Cadastre café moído ou grão no{' '}
              <button type="button" className={styles.linkBtn} onClick={() => setTab('estoque')}>
                estoque
              </button>{' '}
              para marcar filtro e prensa como prontos.
            </p>
          ) : null}

          {!editing && filters.stockMode !== 'all' && visibleRecipes.length === 0 ? (
            <div className={drinkStyles.adegaEmptyState}>
              <p className={drinkStyles.adegaEmptyStateTitle}>
                {filters.stockMode === 'ready'
                  ? 'Nenhuma receita completa por enquanto'
                  : 'Nenhuma receita quase completa'}
              </p>
              <p className={drinkStyles.adegaEmptyStateText}>
                {filters.stockMode === 'ready'
                  ? 'Cápsulas sempre aparecem aqui; filtro e prensa só com estoque completo.'
                  : 'Só aparecem receitas de filtro ou prensa que faltam um item.'}
              </p>
              <button
                type="button"
                className={drinkStyles.adegaEmptyStateBtn}
                onClick={() => setFilters((prev) => ({ ...prev, stockMode: 'all' }))}
              >
                Ver todas as receitas
              </button>
            </div>
          ) : visibleRecipes.length === 0 ? (
            <div className={drinkStyles.adegaEmptyState}>
              <p className={drinkStyles.adegaEmptyStateTitle}>Nenhuma receita encontrada</p>
              <p className={drinkStyles.adegaEmptyStateText}>
                Tente outro termo ou limpe os filtros.
              </p>
              <button
                type="button"
                className={drinkStyles.adegaEmptyStateBtn}
                onClick={() =>
                  setFilters({
                    search: '',
                    method: null,
                    capsuleSystem: null,
                    stockMode: 'all',
                  })
                }
              >
                Limpar busca
              </button>
            </div>
          ) : (
            <CoffeeCartaList
              recipes={visibleRecipes}
              viewMode={cartaViewMode}
              editing={editing}
              stockMatches={stockMatches}
              onOpenRecipe={openRecipe}
              onEditRecipe={setEditorSlug}
            />
          )}
        </>
      ) : (
        <>
          <div className={styles.stockHead}>
            <p className={styles.stockLead}>
              Cápsulas Dolce Gusto, Três Corações, Nespresso, grãos e equipamentos.
            </p>
            {editing ? (
              <button type="button" className={styles.addBtn} onClick={openStockCreate}>
                + Adicionar
              </button>
            ) : null}
          </div>

          <div className={styles.systemsRow}>
            {COFFEE_CAPSULE_SYSTEMS.map((system) => (
              <div key={system.id} className={styles.systemCard}>
                <img src={system.icon} alt="" />
                <span>{system.label}</span>
              </div>
            ))}
          </div>

          <nav className={adegaStyles.adegaNav} aria-label="Busca e filtros do estoque">
            <div className={adegaStyles.toolbar}>
              <label className={adegaStyles.searchWrap}>
                <span className={adegaStyles.searchIcon} aria-hidden>
                  ⌕
                </span>
                <input
                  type="search"
                  className={adegaStyles.search}
                  placeholder="Buscar cápsulas, grãos e equipamentos…"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  aria-label="Buscar no estoque"
                  enterKeyHint="search"
                />
              </label>
              {!editing ? (
                <CoffeeStockViewMenu viewMode={stockViewMode} onViewModeChange={handleStockViewModeChange} />
              ) : null}
              {editing ? (
                <button
                  type="button"
                  className={`${styles.addBtn} ${adegaStyles.toolbarAddBtn}`}
                  onClick={openStockCreate}
                >
                  + Adicionar
                </button>
              ) : null}
            </div>

            {stockCategories.length > 0 ? (
              <div className={adegaStyles.filtersWrap}>
                <div className={adegaStyles.filters} role="group" aria-label="Filtrar por categoria">
                  <button
                    type="button"
                    className={`${adegaStyles.filterBtn} ${stockCategoryFilter == null ? adegaStyles.filterBtnActive : ''}`}
                    onClick={() => setStockCategoryFilter(null)}
                  >
                    Todas
                  </button>
                  {stockCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`${adegaStyles.filterBtn} ${stockCategoryFilter === category ? adegaStyles.filterBtnActive : ''}`}
                      onClick={() => setStockCategoryFilter(category)}
                      title={category}
                    >
                      <span aria-hidden>{categoryEmoji(category)}</span>
                      <span className={adegaStyles.filterLabel}>{category}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </nav>

          <CoffeeStockCards
            items={filteredStock}
            editing={editing}
            viewMode={stockViewMode}
            recipeCountByItemId={recipeCountByItemId}
            emptyTitle={stock.length === 0 ? 'Nenhum item cadastrado' : 'Nenhum item encontrado'}
            emptyText={
              stock.length === 0
                ? 'Adicione cápsulas, grãos ou equipamentos para cruzar com a carta.'
                : 'Tente outro termo ou remova o filtro de categoria.'
            }
            onCardClick={setViewingStockItem}
            onEdit={openStockEdit}
            onDelete={handleDeleteStock}
            onToggleQuantity={toggleStockQuantity}
          />
        </>
      )}

      {stockDialogOpen ? (
        <div className={styles.overlay} role="presentation" onClick={() => setStockDialogOpen(false)}>
          <form
            className={styles.dialog}
            onSubmit={handleStockSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.dialogTitle}>
              {editingStockId ? 'Editar item' : 'Adicionar ao estoque'}
            </h3>
            <label className={styles.field}>
              <span>Nome</span>
              <input
                required
                value={stockForm.name}
                onChange={(e) => setStockForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span>Categoria</span>
              <select
                value={stockForm.category}
                onChange={(e) => setStockForm((f) => ({ ...f, category: e.target.value }))}
              >
                {COFFEE_STOCK_CATEGORY_PRESETS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            {stockForm.category === 'Outro' ? (
              <label className={styles.field}>
                <span>Categoria personalizada</span>
                <input
                  value={stockForm.customCategory}
                  onChange={(e) => setStockForm((f) => ({ ...f, customCategory: e.target.value }))}
                />
              </label>
            ) : null}
            <label className={styles.field}>
              <span>Marca (opcional)</span>
              <input
                value={stockForm.brand}
                onChange={(e) => setStockForm((f) => ({ ...f, brand: e.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span>Intensidade 1–12 (opcional)</span>
              <input
                type="number"
                min={1}
                max={12}
                value={stockForm.intensity}
                onChange={(e) => setStockForm((f) => ({ ...f, intensity: e.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span>Quantidade</span>
              <input
                type="number"
                min={0}
                required
                value={stockForm.quantity}
                onChange={(e) => setStockForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span>Notas</span>
              <textarea
                rows={2}
                value={stockForm.notes}
                onChange={(e) => setStockForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </label>

            <CoffeeStockPhotoTools
              name={stockForm.name}
              brand={stockForm.brand}
              category={stockForm.category}
              customCategory={stockForm.customCategory}
              imageUrl={stockForm.imageUrl}
              imageUrlInput={stockForm.imageUrlInput}
              userId={userId}
              itemId={editingStockId ?? draftStockIdRef.current}
              photoInputRef={stockPhotoInputRef}
              onImageUrlInputChange={(value) =>
                setStockForm((f) => ({ ...f, imageUrlInput: value }))
              }
              onImageUrl={(url) =>
                setStockForm((f) => ({ ...f, imageUrl: url, imageUrlInput: url }))
              }
              onClearPhoto={() =>
                setStockForm((f) => ({ ...f, imageUrl: '', imageUrlInput: '' }))
              }
            />

            <div className={styles.dialogActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setStockDialogOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className={styles.saveBtn}>
                Salvar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {newRecipeOpen ? (
        <CoffeeNewRecipeDialog
          onClose={() => setNewRecipeOpen(false)}
          onSave={(recipe) => {
            persistStore(addCustomCoffeeRecipe(store, recipe));
            setNewRecipeOpen(false);
          }}
        />
      ) : null}

      {editorRecipe ? (
        <CoffeeRecipeEditor
          recipe={editorRecipe}
          onClose={() => setEditorSlug(null)}
          onSave={(patch) => {
            persistStore(updateCoffeeOverride(store, editorRecipe.slug, patch));
            setEditorSlug(null);
          }}
        />
      ) : null}

      {viewingStockItem ? (
        <CoffeeStockItemDetail
          item={stock.find((entry) => entry.id === viewingStockItem.id) ?? viewingStockItem}
          recipes={getRecipesForStockItem(
            stock.find((entry) => entry.id === viewingStockItem.id) ?? viewingStockItem,
            recipes,
          )}
          onClose={() => setViewingStockItem(null)}
          onOpenRecipe={openRecipe}
          onToggleQuantity={() => toggleStockQuantity(viewingStockItem.id)}
        />
      ) : null}
    </div>
  );
}

function CoffeeStockItemDetail({
  item,
  recipes: linkedRecipes,
  onClose,
  onOpenRecipe,
  onToggleQuantity,
}: {
  item: CoffeeStockItem;
  recipes: ViniciusCoffeeRecipe[];
  onClose: () => void;
  onOpenRecipe: (slug: string) => void;
  onToggleQuantity: () => void;
}) {
  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div className={styles.stockDetail} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className={styles.stockDetailClose} onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <div className={styles.stockDetailHero}>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className={styles.stockDetailPhoto} />
          ) : (
            <span className={styles.stockDetailEmoji}>{item.iconEmoji ?? categoryEmoji(item.category)}</span>
          )}
        </div>
        <h3 className={styles.stockDetailTitle}>{item.name}</h3>
        <p className={styles.stockDetailMeta}>
          {item.category}
          {item.brand ? ` · ${item.brand}` : ''}
          {item.intensity != null ? ` · Int. ${item.intensity}` : ''}
        </p>
        <p className={styles.stockDetailQty}>
          {item.quantity > 0 ? `${item.quantity} em estoque` : 'Sem estoque'}
        </p>
        {item.notes ? <p className={styles.stockDetailNotes}>{item.notes}</p> : null}
        <div className={styles.stockDetailActions}>
          <button type="button" className={styles.saveBtn} onClick={onToggleQuantity}>
            {item.quantity > 0 ? 'Marcar como acabou' : 'Tenho de novo'}
          </button>
        </div>
        {linkedRecipes.length > 0 ? (
          <section className={styles.stockDetailRecipes}>
            <h4>Receitas com este item</h4>
            <ul>
              {linkedRecipes.map((recipe) => (
                <li key={recipe.slug}>
                  <button type="button" className={styles.linkBtn} onClick={() => onOpenRecipe(recipe.slug)}>
                    {recipe.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function CoffeeRecipeEditor({
  recipe,
  onClose,
  onSave,
}: {
  recipe: ViniciusCoffeeRecipe;
  onClose: () => void;
  onSave: (patch: CoffeeCartaOverride) => void;
}) {
  const [title, setTitle] = useState(recipe.title);
  const [tagline, setTagline] = useState(recipe.tagline);
  const [ingredients, setIngredients] = useState(listToLines(recipe.ingredients));
  const [steps, setSteps] = useState(listToLines(recipe.steps));
  const [notes, setNotes] = useState(recipe.notes ?? '');

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <form
        className={styles.dialog}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            title,
            tagline,
            ingredients: linesToList(ingredients),
            steps: linesToList(steps),
            notes: notes.trim() || undefined,
          });
        }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3 className={styles.dialogTitle}>Editar {recipe.title}</h3>
        <label className={styles.field}>
          <span>Título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className={styles.field}>
          <span>Descrição</span>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Ingredientes (um por linha)</span>
          <textarea rows={4} value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Passos (um por linha)</span>
          <textarea rows={5} value={steps} onChange={(e) => setSteps(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Notas</span>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className={styles.saveBtn}>
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

function CoffeeNewRecipeDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (recipe: ViniciusCoffeeRecipe) => void;
}) {
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [system, setSystem] = useState<CoffeeCapsuleSystem | ''>('dolce-gusto');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <form
        className={styles.dialog}
        onSubmit={(e) => {
          e.preventDefault();
          const slug = createCustomCoffeeSlug(title);
          const capsuleSystem = system || undefined;
          onSave({
            slug,
            title: title.trim(),
            tagline: tagline.trim(),
            imageUrl: capsuleSystem
              ? (capsuleSystemIcon(capsuleSystem) ?? COFFEE_FALLBACK_THUMB)
              : COFFEE_FALLBACK_THUMB,
            method: capsuleSystem ? 'capsula' : 'outro',
            capsuleSystem,
            ingredients: linesToList(ingredients),
            steps: linesToList(steps),
          });
        }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3 className={styles.dialogTitle}>Nova receita</h3>
        <label className={styles.field}>
          <span>Título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className={styles.field}>
          <span>Descrição</span>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Sistema de cápsula</span>
          <select value={system} onChange={(e) => setSystem(e.target.value as typeof system)}>
            <option value="">Nenhum / outro método</option>
            <option value="dolce-gusto">Dolce Gusto</option>
            <option value="tres-coracoes">Três Corações</option>
            <option value="nespresso">Nespresso</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Ingredientes</span>
          <textarea rows={3} value={ingredients} onChange={(e) => setIngredients(e.target.value)} required />
        </label>
        <label className={styles.field}>
          <span>Passos</span>
          <textarea rows={4} value={steps} onChange={(e) => setSteps(e.target.value)} required />
        </label>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className={styles.saveBtn}>
            Adicionar
          </button>
        </div>
      </form>
    </div>
  );
}
