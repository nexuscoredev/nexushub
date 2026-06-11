import { supabase, supabaseErrorMessage } from './supabase';

export const DEV_WHITEBOARD_ID = 'nexus-equipe';

export type WhiteboardTool = 'select' | 'pen' | 'sticky' | 'hand' | 'link';

export interface WhiteboardPoint {
  x: number;
  y: number;
}

export interface WhiteboardViewport {
  panX: number;
  panY: number;
  zoom: number;
}

export interface WhiteboardStroke {
  id: string;
  type: 'stroke';
  points: WhiteboardPoint[];
  color: string;
  width: number;
}

export interface WhiteboardSticky {
  id: string;
  type: 'sticky';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
}

export interface WhiteboardImage {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
}

export interface WhiteboardConnector {
  id: string;
  type: 'connector';
  fromId: string;
  toId: string;
}

export type WhiteboardElement =
  | WhiteboardStroke
  | WhiteboardSticky
  | WhiteboardImage
  | WhiteboardConnector;

export type WhiteboardMovable = WhiteboardSticky | WhiteboardImage;

export interface WhiteboardScene {
  version: 1;
  viewport: WhiteboardViewport;
  elements: WhiteboardElement[];
}

export const DEFAULT_WHITEBOARD_SCENE: WhiteboardScene = {
  version: 1,
  viewport: { panX: 48, panY: 48, zoom: 1 },
  elements: [],
};

export const PEN_COLORS = ['#f5f5f5', '#93c5fd', '#86efac', '#fca5a5', '#fbbf24'] as const;

export const STICKY_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e9d5ff'] as const;

export function newElementId(): string {
  return crypto.randomUUID();
}

export function strokeToPath(points: WhiteboardPoint[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ${rest.map((p) => `L ${p.x} ${p.y}`).join(' ')}`;
}

export function isMovableElement(el: WhiteboardElement): el is WhiteboardMovable {
  return el.type === 'sticky' || el.type === 'image';
}

export function elementCenter(el: WhiteboardElement): WhiteboardPoint | null {
  if (el.type === 'sticky' || el.type === 'image') {
    return { x: el.x + el.width / 2, y: el.y + el.height / 2 };
  }
  if (el.type === 'stroke' && el.points.length > 0) {
    const xs = el.points.map((p) => p.x);
    const ys = el.points.map((p) => p.y);
    return {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };
  }
  return null;
}

export function connectorCurvePath(from: WhiteboardPoint, to: WhiteboardPoint): string {
  const mx = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.x} ${to.y}`;
}

export function sceneWithoutElement(scene: WhiteboardScene, id: string): WhiteboardScene {
  return {
    ...scene,
    elements: scene.elements.filter((el) => {
      if (el.id === id) return false;
      if (el.type === 'connector' && (el.fromId === id || el.toId === id)) return false;
      return true;
    }),
  };
}

export function moveMovable(
  scene: WhiteboardScene,
  id: string,
  x: number,
  y: number,
): WhiteboardScene {
  return {
    ...scene,
    elements: scene.elements.map((el) => {
      if (el.id === id && isMovableElement(el)) {
        return { ...el, x, y };
      }
      return el;
    }),
  };
}

const MAX_IMAGE_EDGE = 720;

export async function readClipboardImage(): Promise<{
  src: string;
  width: number;
  height: number;
} | null> {
  if (!navigator.clipboard?.read) return null;
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const type = item.types.find((t) => t.startsWith('image/'));
      if (!type) continue;
      const blob = await item.getType(type);
      return await blobToScaledDataUrl(blob, MAX_IMAGE_EDGE);
    }
  } catch {
    return null;
  }
  return null;
}

function blobToScaledDataUrl(
  blob: Blob,
  maxEdge: number,
): Promise<{ src: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const scale = Math.min(1, maxEdge / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas indisponível'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve({ src: canvas.toDataURL('image/jpeg', 0.82), width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Imagem inválida'));
    };
    img.src = url;
  });
}

function isWhiteboardElement(value: unknown): value is WhiteboardElement {
  if (!value || typeof value !== 'object') return false;
  const el = value as { type?: string; id?: string };
  if (!el.id || !el.type) return false;
  return ['stroke', 'sticky', 'image', 'connector'].includes(el.type);
}

function parseScene(raw: unknown): WhiteboardScene {
  if (!raw || typeof raw !== 'object') return DEFAULT_WHITEBOARD_SCENE;
  const data = raw as Partial<WhiteboardScene>;
  const viewport = data.viewport ?? DEFAULT_WHITEBOARD_SCENE.viewport;
  const elements = Array.isArray(data.elements) ? data.elements : [];
  return {
    version: 1,
    viewport: {
      panX: Number(viewport.panX) || 0,
      panY: Number(viewport.panY) || 0,
      zoom: Math.min(3, Math.max(0.25, Number(viewport.zoom) || 1)),
    },
    elements: elements.filter(isWhiteboardElement),
  };
}

export async function fetchDevWhiteboard(): Promise<{
  scene: WhiteboardScene;
  updatedAt: string | null;
}> {
  if (!supabase) {
    return { scene: DEFAULT_WHITEBOARD_SCENE, updatedAt: null };
  }

  const { data, error } = await supabase
    .from('hub_dev_whiteboard')
    .select('scene, updated_at')
    .eq('board_id', DEV_WHITEBOARD_ID)
    .maybeSingle();

  if (error) throw new Error(supabaseErrorMessage(error));
  if (!data) return { scene: DEFAULT_WHITEBOARD_SCENE, updatedAt: null };

  return {
    scene: parseScene(data.scene),
    updatedAt: data.updated_at ?? null,
  };
}

export async function saveDevWhiteboard(
  scene: WhiteboardScene,
  userId: string | undefined,
): Promise<string | null> {
  if (!supabase) throw new Error('Supabase não configurado');

  const { data, error } = await supabase
    .from('hub_dev_whiteboard')
    .upsert(
      {
        board_id: DEV_WHITEBOARD_ID,
        scene,
        updated_at: new Date().toISOString(),
        updated_by: userId ?? null,
      },
      { onConflict: 'board_id' },
    )
    .select('updated_at')
    .single();

  if (error) throw new Error(supabaseErrorMessage(error));
  return data.updated_at ?? null;
}

export function subscribeDevWhiteboard(
  onRemoteScene: (scene: WhiteboardScene, updatedAt: string) => void,
): () => void {
  if (!supabase) return () => undefined;

  const channel = supabase
    .channel('hub-dev-whiteboard-sync')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'hub_dev_whiteboard',
        filter: `board_id=eq.${DEV_WHITEBOARD_ID}`,
      },
      (payload) => {
        const row = payload.new as { scene?: unknown; updated_at?: string };
        if (!row.updated_at) return;
        onRemoteScene(parseScene(row.scene), row.updated_at);
      },
    )
    .subscribe();

  return () => {
    void supabase?.removeChannel(channel);
  };
}
