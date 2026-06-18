import {
  catalogForUser,
  defaultAppOrder,
  type PersonalCustomApp,
} from './personalApps';

const STORAGE_PREFIX = 'nexus-pessoal-apps';

export type PersonalAppLayout = {
  order: string[];
  customApps: PersonalCustomApp[];
};

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function parseLayout(raw: string | null): PersonalAppLayout | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<PersonalAppLayout>;
    if (!Array.isArray(data.order)) return null;
    const order = data.order.filter((id): id is string => typeof id === 'string' && id.length > 0);
    const customApps = Array.isArray(data.customApps)
      ? data.customApps.filter(
          (app): app is PersonalCustomApp =>
            !!app &&
            typeof app === 'object' &&
            typeof app.id === 'string' &&
            typeof app.label === 'string' &&
            typeof app.href === 'string',
        )
      : [];
    return { order, customApps };
  } catch {
    return null;
  }
}

export function normalizePersonalAppLayout(
  layout: PersonalAppLayout | null,
  viniciusOnly: boolean,
): PersonalAppLayout {
  const catalog = catalogForUser(viniciusOnly);
  const allowedCatalogIds = new Set(catalog.map((app) => app.id));
  const defaults = defaultAppOrder(viniciusOnly);

  const customApps = (layout?.customApps ?? []).filter(
    (app) => app.id.startsWith('custom-') && app.label.trim() && app.href.trim(),
  );
  const customIds = new Set(customApps.map((app) => app.id));

  const order: string[] = [];
  const seen = new Set<string>();

  for (const id of layout?.order ?? []) {
    if (seen.has(id)) continue;
    if (!allowedCatalogIds.has(id) && !customIds.has(id)) continue;
    order.push(id);
    seen.add(id);
  }

  for (const id of defaults) {
    if (!seen.has(id)) {
      order.push(id);
      seen.add(id);
    }
  }

  if (order.length === 0) {
    return { order: defaults, customApps };
  }

  return { order, customApps };
}

export function loadPersonalAppLayout(
  userId: string | undefined,
  viniciusOnly: boolean,
): PersonalAppLayout {
  const fallback = normalizePersonalAppLayout(null, viniciusOnly);
  if (!userId || typeof localStorage === 'undefined') return fallback;

  const stored = parseLayout(localStorage.getItem(storageKey(userId)));
  return normalizePersonalAppLayout(stored, viniciusOnly);
}

export function savePersonalAppLayout(userId: string, layout: PersonalAppLayout): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(layout));
}
