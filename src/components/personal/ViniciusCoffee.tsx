import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  filterCoffeeByStock,
  matchCoffeeRecipeToStock,
  matchCoffeeRecipesToStock,
} from '../../lib/coffeeStockMatch';
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
  type CoffeeStockInput,
  type CoffeeStockItem,
} from '../../lib/viniciusCoffeeStock';
import { DrinkThumb } from './DrinkThumb';
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
};

const EMPTY_STOCK_FORM: StockFormState = {
  name: '',
  category: COFFEE_STOCK_CATEGORY_PRESETS[0],
  customCategory: '',
  brand: '',
  intensity: '',
  quantity: '10',
  notes: '',
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
  const [cartaSearch, setCartaSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'ready'>('all');
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState<StockFormState>(EMPTY_STOCK_FORM);
  const [recipeEditorOpen, setRecipeEditorOpen] = useState(false);
  const [newRecipeOpen, setNewRecipeOpen] = useState(false);

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
  const hasStock = stock.some((item) => item.quantity > 0);
  const readyCount = useMemo(
    () => filterCoffeeByStock(recipes, stock, 'ready').length,
    [recipes, stock],
  );

  const filteredRecipes = useMemo(() => {
    let list = recipes;
    if (stockFilter === 'ready' && hasStock) {
      list = filterCoffeeByStock(list, stock, 'ready');
    }
    const q = cartaSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((recipe) =>
      [recipe.title, recipe.tagline, ...recipe.ingredients].join(' ').toLowerCase().includes(q),
    );
  }, [recipes, stock, stockFilter, hasStock, cartaSearch]);

  const filteredStock = useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    if (!q) return stock;
    return stock.filter((item) =>
      [item.name, item.brand ?? '', item.category, item.notes ?? ''].join(' ').toLowerCase().includes(q),
    );
  }, [stock, stockSearch]);

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
          id: createCoffeeStockId(),
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
          {activeMatch && hasStock ? (
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
              {hasStock && readyCount > 0 ? (
                <span className={styles.pillReady}>{readyCount} com seu estoque</span>
              ) : null}
            </div>
          </header>

          <div className={styles.filters}>
            <input
              type="search"
              className={styles.search}
              placeholder="Buscar receita…"
              value={cartaSearch}
              onChange={(e) => setCartaSearch(e.target.value)}
            />
            {hasStock ? (
              <div className={styles.chips}>
                <button
                  type="button"
                  className={`${styles.chip} ${stockFilter === 'all' ? styles.chipActive : ''}`}
                  onClick={() => setStockFilter('all')}
                >
                  Todas
                </button>
                <button
                  type="button"
                  className={`${styles.chip} ${stockFilter === 'ready' ? styles.chipActive : ''}`}
                  onClick={() => setStockFilter('ready')}
                >
                  Posso fazer ({readyCount})
                </button>
              </div>
            ) : null}
            {editing ? (
              <button type="button" className={styles.addBtn} onClick={() => setNewRecipeOpen(true)}>
                + Nova receita
              </button>
            ) : null}
          </div>

          {!hasStock ? (
            <p className={styles.hint}>
              Cadastre cápsulas no{' '}
              <button type="button" className={styles.linkBtn} onClick={() => setTab('estoque')}>
                estoque
              </button>{' '}
              para ver o que você pode preparar agora.
            </p>
          ) : null}

          <ul className={styles.recipeList}>
            {filteredRecipes.map((recipe) => {
              const match = stockMatches.get(recipe.slug);
              return (
                <li key={recipe.slug}>
                  <button type="button" className={styles.recipeCard} onClick={() => openRecipe(recipe.slug)}>
                    <DrinkThumb
                      src={recipe.imageUrl}
                      alt=""
                      className={styles.recipeThumb}
                      fallbackClassName={styles.recipeThumbFallback}
                    />
                    <span className={styles.recipeBody}>
                      <span className={styles.recipeTitleRow}>
                        <span className={styles.recipeTitle}>{recipe.title}</span>
                        {match?.status === 'ready' ? (
                          <span className={styles.badgeReady}>Estoque</span>
                        ) : null}
                      </span>
                      <span className={styles.recipeTagline}>{recipe.tagline}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <>
          <div className={styles.stockHead}>
            <p className={styles.stockLead}>
              Cápsulas Dolce Gusto, Três Corações, grãos e equipamentos.
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

          <input
            type="search"
            className={styles.search}
            placeholder="Buscar no estoque…"
            value={stockSearch}
            onChange={(e) => setStockSearch(e.target.value)}
          />

          <ul className={styles.stockList}>
            {filteredStock.length === 0 ? (
              <li className={styles.empty}>Nenhum item cadastrado.</li>
            ) : (
              filteredStock.map((item) => (
                <li key={item.id} className={styles.stockItem}>
                  <button
                    type="button"
                    className={styles.stockMain}
                    onClick={() => (editing ? openStockEdit(item) : undefined)}
                  >
                    <span className={styles.stockEmoji} aria-hidden>
                      {item.iconEmoji ?? categoryEmoji(item.category)}
                    </span>
                    <span className={styles.stockInfo}>
                      <span className={styles.stockName}>{item.name}</span>
                      <span className={styles.stockMeta}>
                        {item.category}
                        {item.brand ? ` · ${item.brand}` : ''}
                        {item.intensity ? ` · Int. ${item.intensity}` : ''}
                      </span>
                    </span>
                    <span className={item.quantity > 0 ? styles.qtyOk : styles.qtyEmpty}>
                      {item.quantity}
                    </span>
                  </button>
                  {!editing ? (
                    <button
                      type="button"
                      className={styles.stockToggle}
                      onClick={() => toggleStockQuantity(item.id)}
                      title={item.quantity > 0 ? 'Marcar como acabou' : 'Tenho de novo'}
                    >
                      {item.quantity > 0 ? '✓' : '○'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.stockDelete}
                      onClick={() => handleDeleteStock(item.id)}
                      aria-label="Excluir"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
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
  const [system, setSystem] = useState<'dolce-gusto' | 'tres-coracoes' | ''>('dolce-gusto');
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
