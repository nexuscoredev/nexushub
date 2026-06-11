import { supabase, supabaseErrorMessage } from './supabase';

export const DEV_WHITEBOARD_ID = 'nexus-equipe';

export type WhiteboardTool = 'select' | 'pen' | 'sticky' | 'hand';

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

export type WhiteboardElement = WhiteboardStroke | WhiteboardSticky;

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
    elements: elements.filter(Boolean) as WhiteboardElement[],
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
