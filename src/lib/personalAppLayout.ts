import {
  catalogForUser,
  defaultAppOrder,
  type PersonalCustomApp,
} from './personalApps';
import { isPersonalAppIcon, migrateLegacyIconOverride, shouldDropIconOverride } from './personalAppIconOptions';
import type { PersonalAppIcon } from './personalApps';
import {
  fetchPersonalAppLayoutCloud,
  isCloudNewer,
  upsertPersonalAppLayoutCloud,
} from './personalCloudSync';

const STORAGE_PREFIX = 'nexus-pessoal-apps';
const UPDATED_AT_SUFFIX = ':updated-at';

export type PersonalAppLayout = {
  order: string[];
  customApps: PersonalCustomApp[];
  iconOverrides: Record<string, PersonalAppIcon>;
};

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function updatedAtKey(userId: string): string {
  return `${STORAGE_PREFIX}${UPDATED_AT_SUFFIX}:${userId}`;
}

function readLocalUpdatedAt(userId: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(updatedAtKey(userId));
}

function writeLocalUpdatedAt(userId: string, iso: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(updatedAtKey(userId), iso);
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
    const iconOverrides: Record<string, PersonalAppIcon> = {};
    if (data.iconOverrides && typeof data.iconOverrides === 'object') {
      for (const [id, icon] of Object.entries(data.iconOverrides)) {
        if (typeof id === 'string' && isPersonalAppIcon(icon)) {
          iconOverrides[id] = icon;
        }
      }
    }
    return { order, customApps, iconOverrides };
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

  const allowedIds = new Set([...allowedCatalogIds, ...customIds]);
  const iconOverrides: Record<string, PersonalAppIcon> = {};
  for (const [id, icon] of Object.entries(layout?.iconOverrides ?? {})) {
    if (!allowedIds.has(id) || !isPersonalAppIcon(icon)) continue;
    if (shouldDropIconOverride(id, icon)) continue;
    iconOverrides[id] = migrateLegacyIconOverride(id, icon);
  }

  if (order.length === 0) {
    return { order: defaults, customApps, iconOverrides };
  }

  return { order, customApps, iconOverrides };
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
  const updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(layout));
    writeLocalUpdatedAt(userId, updatedAt);
  } catch {
    /* quota exceeded */
  }
  void upsertPersonalAppLayoutCloud(userId, layout).then((result) => {
    if (result.error) {
      console.warn('[personal apps] sync:', result.error);
      return;
    }
    savePersonalAppLayoutLocalOnly(userId, result.layout, result.updatedAt);
  });
}

export async function syncPersonalAppLayoutFromCloud(
  userId: string,
  viniciusOnly: boolean,
): Promise<PersonalAppLayout | null> {
  const localUpdatedAt = readLocalUpdatedAt(userId);
  const stored =
    typeof localStorage !== 'undefined' ? parseLayout(localStorage.getItem(storageKey(userId))) : null;
  const localLayout = normalizePersonalAppLayout(stored, viniciusOnly);

  const cloud = await fetchPersonalAppLayoutCloud(userId);

  if (!cloud) {
    if (stored) {
      const pushed = await upsertPersonalAppLayoutCloud(userId, localLayout);
      if (!pushed.error) {
        savePersonalAppLayoutLocalOnly(userId, pushed.layout, pushed.updatedAt);
      }
    }
    return null;
  }

  const normalized = normalizePersonalAppLayout(cloud.layout, viniciusOnly);

  if (isCloudNewer(cloud.updatedAt, localUpdatedAt)) {
    savePersonalAppLayoutLocalOnly(userId, normalized, cloud.updatedAt);
    return normalized;
  }

  if (localUpdatedAt && Date.parse(localUpdatedAt) > Date.parse(cloud.updatedAt)) {
    const pushed = await upsertPersonalAppLayoutCloud(userId, localLayout);
    if (!pushed.error) {
      savePersonalAppLayoutLocalOnly(userId, pushed.layout, pushed.updatedAt);
    }
    return localLayout;
  }

  return null;
}

function savePersonalAppLayoutLocalOnly(
  userId: string,
  layout: PersonalAppLayout,
  updatedAt: string,
): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(layout));
    writeLocalUpdatedAt(userId, updatedAt);
  } catch {
    /* quota exceeded */
  }
}
