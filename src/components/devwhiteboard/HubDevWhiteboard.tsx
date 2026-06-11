import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  DEFAULT_WHITEBOARD_SCENE,
  PEN_COLORS,
  STICKY_COLORS,
  CONNECTOR_ANCHORS,
  buildConnector,
  connectorCurvePath,
  deleteDevWhiteboardSnapshot,
  elementAnchorPoint,
  fetchDevWhiteboard,
  fetchDevWhiteboardSnapshots,
  findElementsInRect,
  isConnectorSnap,
  isMovableElement,
  moveMovable,
  newElementId,
  normalizeRect,
  readClipboardImage,
  resizeSticky,
  resolveConnectorEndpoints,
  saveDevWhiteboard,
  saveDevWhiteboardSnapshot,
  sceneWithoutElement,
  sceneWithoutElements,
  snapConnectorPoint,
  strokeToPath,
  subscribeDevWhiteboard,
  subscribeDevWhiteboardSnapshots,
  type ConnectorAnchor,
  type ConnectorSnap,
  type WhiteboardConnector,
  type WhiteboardImage,
  type WhiteboardPoint,
  type WhiteboardScene,
  type WhiteboardSnapshot,
  type WhiteboardSticky,
  type WhiteboardTool,
} from '../../lib/devWhiteboard';
import styles from './HubDevWhiteboard.module.css';

const STICKY_W = 220;
const STICKY_H = 150;
const STICKY_MIN_W = 140;
const STICKY_MIN_H = 100;
const STICKY_MAX_W = 520;
const STICKY_MAX_H = 420;
const MARQUEE_MIN_DRAG = 6;
const MIN_LINK_DRAG = 10;
const HISTORY_LIMIT = 50;

type StickyResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const STICKY_RESIZE_HANDLES: StickyResizeHandle[] = [
  'nw',
  'n',
  'ne',
  'e',
  'se',
  's',
  'sw',
  'w',
];

const TOOL_WHEEL_SIZE = 268;
const TOOL_WHEEL_CENTER = TOOL_WHEEL_SIZE / 2;
const TOOL_WHEEL_INNER = 34;
const TOOL_WHEEL_OUTER = 124;
const TOOL_WHEEL_LABEL_RADIUS = 82;
const TOOL_WHEEL_DEAD_ZONE = 34;

const TOOL_WHEEL_SECTORS: {
  id: WhiteboardTool;
  label: string;
  glyph: string;
  start: number;
  end: number;
  angle: number;
}[] = [
  { id: 'sticky', label: 'Nota', glyph: '▢', start: 0, end: 90, angle: 45 },
  { id: 'select', label: 'Selecionar', glyph: '◎', start: 90, end: 180, angle: 135 },
  { id: 'pen', label: 'Caneta', glyph: '✎', start: 180, end: 270, angle: 225 },
  { id: 'link', label: 'Seta', glyph: '→', start: 270, end: 360, angle: 315 },
];

function describeDonutSector(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngleDeg: number,
  endAngleDeg: number,
): string {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const start = rad(startAngleDeg);
  const end = rad(endAngleDeg);
  const x1 = cx + outerR * Math.cos(start);
  const y1 = cy + outerR * Math.sin(start);
  const x2 = cx + outerR * Math.cos(end);
  const y2 = cy + outerR * Math.sin(end);
  const x3 = cx + innerR * Math.cos(end);
  const y3 = cy + innerR * Math.sin(end);
  const x4 = cx + innerR * Math.cos(start);
  const y4 = cy + innerR * Math.sin(start);
  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;

  return [
    `M ${x1} ${y1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
    'Z',
  ].join(' ');
}

function pickWheelTool(dx: number, dy: number): WhiteboardTool {
  const dist = Math.hypot(dx, dy);
  if (dist < TOOL_WHEEL_DEAD_ZONE) return 'select';

  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle < 0) angle += 360;

  for (const sector of TOOL_WHEEL_SECTORS) {
    if (angle >= sector.start && angle < sector.end) return sector.id;
  }

  return 'link';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeStickyResize(
  handle: StickyResizeHandle,
  startX: number,
  startY: number,
  startW: number,
  startH: number,
  dx: number,
  dy: number,
): { x: number; y: number; width: number; height: number } {
  let x = startX;
  let y = startY;
  let width = startW;
  let height = startH;

  const affectsEast = handle.includes('e');
  const affectsWest = handle.includes('w');
  const affectsSouth = handle.includes('s');
  const affectsNorth = handle.includes('n');

  if (affectsEast) width = clamp(startW + dx, STICKY_MIN_W, STICKY_MAX_W);
  if (affectsWest) {
    width = clamp(startW - dx, STICKY_MIN_W, STICKY_MAX_W);
    x = startX + startW - width;
  }
  if (affectsSouth) height = clamp(startH + dy, STICKY_MIN_H, STICKY_MAX_H);
  if (affectsNorth) {
    height = clamp(startH - dy, STICKY_MIN_H, STICKY_MAX_H);
    y = startY + startH - height;
  }

  return { x, y, width, height };
}

function cloneScene(scene: WhiteboardScene): WhiteboardScene {
  return structuredClone(scene);
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLInputElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function formatSnapshotMeta(snapshot: WhiteboardSnapshot): string {
  const when = new Date(snapshot.createdAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return snapshot.authorName ? `${snapshot.authorName} · ${when}` : when;
}

function defaultSnapshotTitle(): string {
  return `Quadro ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;
}

interface HubDevWhiteboardProps {
  fullHeight?: boolean;
}

export function HubDevWhiteboard({ fullHeight = false }: HubDevWhiteboardProps) {
  const { user, profile } = useAuth();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<WhiteboardScene>(DEFAULT_WHITEBOARD_SCENE);
  const activeViewRef = useRef<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const skipRemoteUntilRef = useRef(0);
  const lastRemoteAtRef = useRef<string | null>(null);
  const elementDragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const resizeRef = useRef<{
    id: string;
    handle: StickyResizeHandle;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    origin: WhiteboardPoint;
  } | null>(null);
  const stickyInputRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  const [scene, setScene] = useState<WhiteboardScene>(DEFAULT_WHITEBOARD_SCENE);
  const [, setHistoryPast] = useState<WhiteboardScene[]>([]);
  const [, setHistoryFuture] = useState<WhiteboardScene[]>([]);
  const [tool, setTool] = useState<WhiteboardTool>('select');
  const [penColor, setPenColor] = useState<string>(PEN_COLORS[0]);
  const [stickyColor, setStickyColor] = useState<string>(STICKY_COLORS[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingStickyId, setEditingStickyId] = useState<string | null>(null);
  const [appearingStickyIds, setAppearingStickyIds] = useState<Set<string>>(() => new Set());
  const [marquee, setMarquee] = useState<{ start: WhiteboardPoint; end: WhiteboardPoint } | null>(
    null,
  );
  const [linkDraft, setLinkDraft] = useState<{ start: WhiteboardPoint; end: WhiteboardPoint } | null>(
    null,
  );
  const linkDragRef = useRef<{ from: ConnectorSnap | WhiteboardPoint } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftStroke, setDraftStroke] = useState<WhiteboardPoint[]>([]);
  const [panning, setPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [snapshots, setSnapshots] = useState<WhiteboardSnapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(true);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [toolWheel, setToolWheel] = useState<{
    x: number;
    y: number;
    hoverTool: WhiteboardTool;
  } | null>(null);

  sceneRef.current = scene;
  activeViewRef.current = activeViewId;

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

  const selectElement = useCallback((id: string, additive = false) => {
    setSelectedIds((prev) => {
      if (additive) {
        return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      }
      return [id];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setEditingStickyId(null);
  }, []);

  const scheduleSave = useCallback(
    (nextScene: WhiteboardScene) => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        setSaving(true);
        setError(null);
        skipRemoteUntilRef.current = Date.now() + 2500;
        void saveDevWhiteboard(nextScene, user?.id)
          .then((updatedAt) => {
            if (updatedAt) {
              setSavedAt(updatedAt);
              lastRemoteAtRef.current = updatedAt;
            }
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : 'Erro ao salvar quadro');
          })
          .finally(() => setSaving(false));
      }, 700);
    },
    [user?.id],
  );

  const applyScene = useCallback(
    (next: WhiteboardScene, options?: { recordHistory?: boolean; persist?: boolean }) => {
      const recordHistory = options?.recordHistory !== false;
      const persist = options?.persist !== false;
      if (recordHistory) {
        setHistoryPast((past) => [...past.slice(-(HISTORY_LIMIT - 1)), cloneScene(sceneRef.current)]);
        setHistoryFuture([]);
      }
      setScene(next);
      if (persist) scheduleSave(next);
    },
    [scheduleSave],
  );

  const undo = useCallback(() => {
    setHistoryPast((past) => {
      if (past.length === 0) return past;
      const previous = past[past.length - 1];
      setHistoryFuture((future) => [cloneScene(sceneRef.current), ...future]);
      setScene(previous);
      scheduleSave(previous);
      clearSelection();
      linkDragRef.current = null;
      setLinkDraft(null);
      return past.slice(0, -1);
    });
  }, [clearSelection, scheduleSave]);

  const redo = useCallback(() => {
    setHistoryFuture((future) => {
      if (future.length === 0) return future;
      const [next, ...rest] = future;
      setHistoryPast((past) => [...past.slice(-(HISTORY_LIMIT - 1)), cloneScene(sceneRef.current)]);
      setScene(next);
      scheduleSave(next);
      clearSelection();
      linkDragRef.current = null;
      setLinkDraft(null);
      return rest;
    });
  }, [clearSelection, scheduleSave]);

  useEffect(() => {
    let cancelled = false;
    void fetchDevWhiteboard()
      .then(({ scene: loaded, updatedAt }) => {
        if (cancelled) return;
        setScene(loaded);
        setHistoryPast([]);
        setHistoryFuture([]);
        setSavedAt(updatedAt);
        lastRemoteAtRef.current = updatedAt;
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar quadro');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = subscribeDevWhiteboard((remoteScene, updatedAt) => {
      if (Date.now() < skipRemoteUntilRef.current) return;
      if (activeViewRef.current !== null) return;
      if (lastRemoteAtRef.current && updatedAt <= lastRemoteAtRef.current) return;
      lastRemoteAtRef.current = updatedAt;
      setSavedAt(updatedAt);
      setScene(remoteScene);
      clearSelection();
      linkDragRef.current = null;
      setLinkDraft(null);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [clearSelection]);

  const refreshSnapshots = useCallback(async () => {
    try {
      const list = await fetchDevWhiteboardSnapshots();
      setSnapshots(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar quadros salvos');
    } finally {
      setSnapshotsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSnapshots();
    const unsubscribe = subscribeDevWhiteboardSnapshots(() => {
      void refreshSnapshots();
    });
    return unsubscribe;
  }, [refreshSnapshots]);

  const clientToWorld = useCallback(
    (clientX: number, clientY: number): WhiteboardPoint => {
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const { panX, panY, zoom } = sceneRef.current.viewport;
      return {
        x: (clientX - rect.left - panX) / zoom,
        y: (clientY - rect.top - panY) / zoom,
      };
    },
    [],
  );

  const viewportCenter = useCallback((): WhiteboardPoint => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return { x: 200, y: 200 };
    const { panX, panY, zoom } = sceneRef.current.viewport;
    return {
      x: (rect.width / 2 - panX) / zoom,
      y: (rect.height / 2 - panY) / zoom,
    };
  }, []);

  const addSticky = useCallback(
    (point: WhiteboardPoint) => {
      const sticky: WhiteboardSticky = {
        id: newElementId(),
        type: 'sticky',
        x: point.x - STICKY_W / 2,
        y: point.y - STICKY_H / 2,
        width: STICKY_W,
        height: STICKY_H,
        text: '',
        color: stickyColor,
      };
      applyScene({
        ...sceneRef.current,
        elements: [...sceneRef.current.elements, sticky],
      });
      setAppearingStickyIds((prev) => new Set(prev).add(sticky.id));
      setSelectedIds([sticky.id]);
    },
    [applyScene, stickyColor],
  );

  const clearStickyAppear = useCallback((id: string) => {
    setAppearingStickyIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const beginStickyEdit = useCallback((id: string) => {
    setSelectedIds([id]);
    setEditingStickyId(id);
    window.requestAnimationFrame(() => {
      stickyInputRefs.current.get(id)?.focus();
    });
  }, []);

  const zoomViewport = useCallback(
    (delta: number) => {
      const next = {
        ...sceneRef.current,
        viewport: {
          ...sceneRef.current.viewport,
          zoom: Math.min(3, Math.max(0.35, sceneRef.current.viewport.zoom + delta)),
        },
      };
      setScene(next);
      scheduleSave(next);
    },
    [scheduleSave],
  );

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      zoomViewport(delta);
    };

    surface.addEventListener('wheel', onWheel, { passive: false });
    return () => surface.removeEventListener('wheel', onWheel);
  }, [zoomViewport]);

  const addImage = useCallback(
    (src: string, width: number, height: number, at?: WhiteboardPoint) => {
      const center = at ?? viewportCenter();
      const image: WhiteboardImage = {
        id: newElementId(),
        type: 'image',
        x: center.x - width / 2,
        y: center.y - height / 2,
        width,
        height,
        src,
      };
      applyScene({
        ...sceneRef.current,
        elements: [...sceneRef.current.elements, image],
      });
      setSelectedIds([image.id]);
    },
    [applyScene, viewportCenter],
  );

  const pasteImageFromClipboard = useCallback(async () => {
    setError(null);
    const image = await readClipboardImage();
    if (!image) {
      setError('Nenhuma imagem na área de transferência (Ctrl+C uma imagem antes).');
      return;
    }
    addImage(image.src, image.width, image.height);
  }, [addImage]);

  const clearLinkDrag = useCallback(() => {
    linkDragRef.current = null;
    setLinkDraft(null);
  }, []);

  const beginLinkDragFromAnchor = useCallback(
    (elementId: string, anchor: ConnectorAnchor, pointerId: number) => {
      const surface = surfaceRef.current;
      if (!surface) return;
      const el = sceneRef.current.elements.find((item) => item.id === elementId);
      if (!el || !isMovableElement(el)) return;
      const point = elementAnchorPoint(el, anchor);
      const from: ConnectorSnap = { elementId, anchor, point };
      linkDragRef.current = { from };
      setLinkDraft({ start: point, end: point });
      setSelectedIds([elementId]);
      setEditingStickyId(null);
      surface.setPointerCapture(pointerId);
    },
    [],
  );

  const finishLinkDrag = useCallback(
    (world: WhiteboardPoint) => {
      const draftRef = linkDragRef.current;
      linkDragRef.current = null;
      setLinkDraft(null);
      if (!draftRef) return;

      const to = snapConnectorPoint(sceneRef.current, world);
      const fromPoint = isConnectorSnap(draftRef.from) ? draftRef.from.point : draftRef.from;
      const toPoint = isConnectorSnap(to) ? to.point : to;
      if (Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y) < MIN_LINK_DRAG) return;

      if (!isConnectorSnap(draftRef.from) || !isConnectorSnap(to)) return;
      const fromSnap = draftRef.from;
      const toSnap = to;
      if (toSnap.elementId === fromSnap.elementId) return;

      const exists = sceneRef.current.elements.some(
        (el) =>
          el.type === 'connector' &&
          ((el.fromId === fromSnap.elementId && el.toId === toSnap.elementId) ||
            (el.fromId === toSnap.elementId && el.toId === fromSnap.elementId)),
      );
      if (exists) return;

      const connector = buildConnector(newElementId(), fromSnap, toSnap);
      applyScene({
        ...sceneRef.current,
        elements: [...sceneRef.current.elements, connector],
      });
      setSelectedIds([connector.id]);
    },
    [applyScene],
  );

  const loadLiveBoard = useCallback(async () => {
    setError(null);
    try {
      const { scene: loaded, updatedAt } = await fetchDevWhiteboard();
      applyScene(loaded, { recordHistory: false });
      setHistoryPast([]);
      setHistoryFuture([]);
      setSavedAt(updatedAt);
      lastRemoteAtRef.current = updatedAt;
      setActiveViewId(null);
      clearSelection();
      clearLinkDrag();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar quadro ao vivo');
    }
  }, [applyScene, clearLinkDrag, clearSelection]);

  const loadSnapshot = useCallback(
    (snapshot: WhiteboardSnapshot) => {
      applyScene(cloneScene(snapshot.scene), { recordHistory: false });
      setHistoryPast([]);
      setHistoryFuture([]);
      setActiveViewId(snapshot.id);
      clearSelection();
      clearLinkDrag();
      skipRemoteUntilRef.current = Date.now() + 2500;
      void saveDevWhiteboard(snapshot.scene, user?.id).then((updatedAt) => {
        if (updatedAt) {
          setSavedAt(updatedAt);
          lastRemoteAtRef.current = updatedAt;
        }
      });
    },
    [applyScene, clearLinkDrag, clearSelection, user?.id],
  );

  const handleSaveForTeam = useCallback(async () => {
    const suggested = defaultSnapshotTitle();
    const title = window.prompt('Nome deste quadro para a equipe:', suggested);
    if (title === null) return;

    setSavingSnapshot(true);
    setError(null);
    try {
      const current = cloneScene(sceneRef.current);
      const updatedAt = await saveDevWhiteboard(current, user?.id);
      if (updatedAt) {
        setSavedAt(updatedAt);
        lastRemoteAtRef.current = updatedAt;
      }
      skipRemoteUntilRef.current = Date.now() + 2500;

      const snapshot = await saveDevWhiteboardSnapshot(current, user?.id, title);
      if (!snapshot.authorName && profile?.nome) {
        snapshot.authorName = profile.nome;
      }
      setSnapshots((prev) => [snapshot, ...prev.filter((item) => item.id !== snapshot.id)]);
      setActiveViewId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar quadro para equipe');
    } finally {
      setSavingSnapshot(false);
    }
  }, [profile?.nome, user?.id]);

  const startElementDrag = (id: string, world: WhiteboardPoint) => {
    const el = sceneRef.current.elements.find((item) => item.id === id);
    if (!el || !isMovableElement(el)) return;
    elementDragRef.current = {
      id,
      offsetX: world.x - el.x,
      offsetY: world.y - el.y,
    };
  };

  const startStickyResize = (id: string, handle: StickyResizeHandle, world: WhiteboardPoint) => {
    const el = sceneRef.current.elements.find((item) => item.id === id);
    if (!el || el.type !== 'sticky') return;
    resizeRef.current = {
      id,
      handle,
      startX: el.x,
      startY: el.y,
      startW: el.width,
      startH: el.height,
      origin: world,
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (loading) return;

    if (event.button === 2) {
      event.preventDefault();
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) return;
      setToolWheel({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        hoverTool: tool,
      });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (toolWheel) setToolWheel(null);

    if (event.button === 1) {
      setPanning(true);
      panStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        panX: sceneRef.current.viewport.panX,
        panY: sceneRef.current.viewport.panY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (event.button !== 0) return;

    const world = clientToWorld(event.clientX, event.clientY);

    if (tool === 'select' && event.shiftKey) {
      setPanning(true);
      panStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        panX: sceneRef.current.viewport.panX,
        panY: sceneRef.current.viewport.panY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (tool === 'sticky') {
      addSticky(world);
      return;
    }

    if (tool === 'link') {
      clearSelection();
      return;
    }

    if (tool === 'pen') {
      setDraftStroke([world]);
      clearSelection();
      clearLinkDrag();
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (tool === 'select') {
      clearLinkDrag();
      setMarquee({ start: world, end: world });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (toolWheel && (event.buttons & 2)) {
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = event.clientX - rect.left - toolWheel.x;
      const dy = event.clientY - rect.top - toolWheel.y;
      const hoverTool = pickWheelTool(dx, dy);
      setToolWheel((prev) => (prev ? { ...prev, hoverTool } : null));
      return;
    }

    if (linkDragRef.current) {
      const world = clientToWorld(event.clientX, event.clientY);
      const snapped = snapConnectorPoint(sceneRef.current, world);
      const end = isConnectorSnap(snapped) ? snapped.point : snapped;
      setLinkDraft((prev) => (prev ? { ...prev, end } : null));
      return;
    }

    if (panning) {
      const dx = event.clientX - panStartRef.current.x;
      const dy = event.clientY - panStartRef.current.y;
      setScene((prev) => ({
        ...prev,
        viewport: {
          ...prev.viewport,
          panX: panStartRef.current.panX + dx,
          panY: panStartRef.current.panY + dy,
        },
      }));
      return;
    }

    const drag = elementDragRef.current;
    if (drag) {
      const world = clientToWorld(event.clientX, event.clientY);
      setScene((prev) =>
        moveMovable(prev, drag.id, world.x - drag.offsetX, world.y - drag.offsetY),
      );
      return;
    }

    const resize = resizeRef.current;
    if (resize) {
      const world = clientToWorld(event.clientX, event.clientY);
      const dx = world.x - resize.origin.x;
      const dy = world.y - resize.origin.y;
      const next = computeStickyResize(
        resize.handle,
        resize.startX,
        resize.startY,
        resize.startW,
        resize.startH,
        dx,
        dy,
      );
      setScene((prev) =>
        resizeSticky(prev, resize.id, next.x, next.y, next.width, next.height),
      );
      return;
    }

    if (marquee) {
      const world = clientToWorld(event.clientX, event.clientY);
      setMarquee((prev) => (prev ? { ...prev, end: world } : null));
      return;
    }

    if (tool === 'pen' && draftStroke.length > 0) {
      const world = clientToWorld(event.clientX, event.clientY);
      setDraftStroke((prev) => [...prev, world]);
    }
  };

  const finishPan = useCallback(() => {
    if (!panning) return;
    setPanning(false);
    applyScene(cloneScene(sceneRef.current));
  }, [applyScene, panning]);

  const finishElementDrag = useCallback(() => {
    if (!elementDragRef.current) return;
    elementDragRef.current = null;
    applyScene(cloneScene(sceneRef.current));
  }, [applyScene]);

  const finishStickyResize = useCallback(() => {
    if (!resizeRef.current) return;
    resizeRef.current = null;
    applyScene(cloneScene(sceneRef.current));
  }, [applyScene]);

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (toolWheel && event.button === 2) {
      setTool(toolWheel.hoverTool);
      clearLinkDrag();
      setToolWheel(null);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (panning) {
      finishPan();
      return;
    }

    if (linkDragRef.current) {
      finishLinkDrag(clientToWorld(event.clientX, event.clientY));
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (elementDragRef.current) {
      finishElementDrag();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (resizeRef.current) {
      finishStickyResize();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (marquee) {
      const rect = normalizeRect(marquee.start, marquee.end);
      if (rect.width >= MARQUEE_MIN_DRAG || rect.height >= MARQUEE_MIN_DRAG) {
        const ids = findElementsInRect(sceneRef.current, rect);
        setSelectedIds((prev) => {
          if (event.shiftKey) return [...new Set([...prev, ...ids])];
          return ids;
        });
        if (ids.length === 0) setEditingStickyId(null);
      } else {
        clearSelection();
      }
      setMarquee(null);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (tool === 'pen' && draftStroke.length > 1) {
      applyScene({
        ...sceneRef.current,
        elements: [
          ...sceneRef.current.elements,
          {
            id: newElementId(),
            type: 'stroke',
            points: draftStroke,
            color: penColor,
            width: 2.5,
          },
        ],
      });
      setTool('select');
    }
    setDraftStroke([]);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const updateStickyText = (id: string, text: string) => {
    applyScene(
      {
        ...sceneRef.current,
        elements: sceneRef.current.elements.map((el) =>
          el.id === id && el.type === 'sticky' ? { ...el, text } : el,
        ),
      },
      { recordHistory: false },
    );
  };

  const deleteElement = useCallback(
    (id: string) => {
      applyScene(sceneWithoutElement(sceneRef.current, id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      if (editingStickyId === id) setEditingStickyId(null);
    },
    [applyScene, editingStickyId],
  );

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    applyScene(sceneWithoutElements(sceneRef.current, selectedIds));
    clearSelection();
    clearLinkDrag();
  }, [applyScene, clearLinkDrag, clearSelection, selectedIds]);

  useEffect(() => {
    if (editingStickyId && !selectedIds.includes(editingStickyId)) {
      setEditingStickyId(null);
    }
  }, [selectedIds, editingStickyId]);

  const clearBoard = () => {
    if (!window.confirm('Limpar todo o quadro? Esta ação afeta a equipe.')) return;
    applyScene({
      ...DEFAULT_WHITEBOARD_SCENE,
      viewport: sceneRef.current.viewport,
    });
    clearSelection();
    clearLinkDrag();
  };

  const deleteActiveBoard = useCallback(async () => {
    if (!activeViewId) return;
    const snapshot = snapshots.find((item) => item.id === activeViewId);
    if (
      !window.confirm(
        `Excluir o quadro "${snapshot?.title ?? 'salvo'}" da equipe? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setError(null);
    try {
      await deleteDevWhiteboardSnapshot(activeViewId);
      setSnapshots((prev) => prev.filter((item) => item.id !== activeViewId));
      await loadLiveBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir quadro');
    }
  }, [activeViewId, loadLiveBoard, snapshots]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      if (event.ctrlKey && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }
      if (event.ctrlKey && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))) {
        event.preventDefault();
        redo();
        return;
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        void pasteImageFromClipboard();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedIds.length > 0) {
          event.preventDefault();
          deleteSelected();
        }
      }
      if (event.key === 'Escape') {
        clearLinkDrag();
        setEditingStickyId(null);
        setToolWheel(null);
        if (tool === 'link') setTool('select');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clearLinkDrag, deleteSelected, pasteImageFromClipboard, redo, selectedIds, tool, undo]);

  const showStickyResize = (elementId: string) =>
    isSelected(elementId) && tool !== 'link';

  const renderStickyResizeHandles = (elementId: string) => {
    if (!showStickyResize(elementId)) return null;
    return STICKY_RESIZE_HANDLES.map((handle) => (
      <div
        key={handle}
        className={`${styles.stickyResizeHandle} ${styles[`stickyResize_${handle}`]}`}
        title="Redimensionar"
        onPointerDown={(e) => {
          e.stopPropagation();
          selectElement(elementId, e.shiftKey);
          startStickyResize(elementId, handle, clientToWorld(e.clientX, e.clientY));
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={() => finishStickyResize()}
      />
    ));
  };

  const renderStickyLinkAnchors = (elementId: string) => {
    if (tool !== 'link') return null;
    const dragFrom = linkDragRef.current?.from;
    return (
      <div className={styles.linkAnchors}>
        {CONNECTOR_ANCHORS.map((anchor) => {
          const isOrigin =
            dragFrom !== undefined &&
            isConnectorSnap(dragFrom) &&
            dragFrom.elementId === elementId &&
            dragFrom.anchor === anchor;
          return (
            <button
              key={anchor}
              type="button"
              className={`${styles.linkAnchor} ${styles[`linkAnchor_${anchor}`]} ${
                isOrigin ? styles.linkAnchorActive : ''
              }`}
              aria-label={`Ligar pela borda ${anchor}`}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (e.button !== 0) return;
                beginLinkDragFromAnchor(elementId, anchor, e.pointerId);
              }}
            />
          );
        })}
      </div>
    );
  };

  const connectors = useMemo(() => {
    const byId = new Map(scene.elements.map((el) => [el.id, el]));
    return scene.elements
      .filter((el): el is WhiteboardConnector => el.type === 'connector')
      .map((connector) => {
        const endpoints = resolveConnectorEndpoints(connector, byId);
        if (!endpoints) return null;
        return { connector, d: connectorCurvePath(endpoints.from, endpoints.to) };
      })
      .filter(Boolean) as { connector: WhiteboardConnector; d: string }[];
  }, [scene.elements]);

  const marqueeRect = marquee ? normalizeRect(marquee.start, marquee.end) : null;

  const { panX, panY, zoom } = scene.viewport;

  return (
    <div className={`${styles.root} ${fullHeight ? styles.rootFull : ''}`}>
      <div className={styles.boardLayout}>
        <aside className={styles.snapshotSidebar} aria-label="Quadros salvos da equipe">
          <div className={styles.snapshotSidebarHead}>
            <h3 className={styles.snapshotSidebarTitle}>Quadros da equipe</h3>
            <p className={styles.snapshotSidebarHint}>Versões salvas para consulta</p>
          </div>

          <button
            type="button"
            className={`${styles.snapshotItem} ${activeViewId === null ? styles.snapshotItemActive : ''}`}
            onClick={() => void loadLiveBoard()}
          >
            <span className={styles.snapshotItemTitle}>Ao vivo</span>
            <span className={styles.snapshotItemMeta}>Quadro colaborativo atual</span>
          </button>

          <div className={styles.snapshotList}>
            {snapshotsLoading ? (
              <p className={styles.snapshotEmpty}>Carregando…</p>
            ) : snapshots.length === 0 ? (
              <p className={styles.snapshotEmpty}>
                Nenhum quadro salvo ainda. Use o botão acima da área de desenho.
              </p>
            ) : (
              snapshots.map((snapshot) => (
                <button
                  key={snapshot.id}
                  type="button"
                  className={`${styles.snapshotItem} ${
                    activeViewId === snapshot.id ? styles.snapshotItemActive : ''
                  }`}
                  onClick={() => loadSnapshot(snapshot)}
                >
                  <span className={styles.snapshotItemTitle}>{snapshot.title}</span>
                  <span className={styles.snapshotItemMeta}>{formatSnapshotMeta(snapshot)}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className={styles.boardMain}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarMain}>
          <div className={styles.toolGroup} role="group" aria-label="Ferramentas">
            {(
              [
                ['select', 'Selecionar'],
                ['pen', 'Caneta'],
                ['sticky', 'Nota'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`${styles.toolBtn} ${tool === id ? styles.toolBtnActive : ''}`}
                onClick={() => {
                  setTool(id);
                  clearLinkDrag();
                }}
                title={label}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.toolbarColorSlot} aria-hidden={tool === 'select'}>
            <div
              className={`${styles.colorRow} ${tool !== 'pen' ? styles.colorRowHidden : ''}`}
              role="group"
              aria-label="Cor da caneta"
            >
              {PEN_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.colorSwatch} ${penColor === color ? styles.colorSwatchActive : ''}`}
                  style={{ background: color }}
                  onClick={() => setPenColor(color)}
                  aria-label={`Cor ${color}`}
                  tabIndex={tool === 'pen' ? 0 : -1}
                />
              ))}
            </div>
            <div
              className={`${styles.colorRow} ${tool !== 'sticky' ? styles.colorRowHidden : ''}`}
              role="group"
              aria-label="Cor da nota"
            >
              {STICKY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.colorSwatch} ${stickyColor === color ? styles.colorSwatchActive : ''}`}
                  style={{ background: color }}
                  onClick={() => setStickyColor(color)}
                  aria-label={`Nota ${color}`}
                  tabIndex={tool === 'sticky' ? 0 : -1}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.toolbarSpacer} />

        <div className={styles.toolbarEnd}>
          <button
            type="button"
            className={styles.saveTeamBtn}
            onClick={() => void handleSaveForTeam()}
            disabled={loading || savingSnapshot}
          >
            {savingSnapshot ? 'Salvando…' : 'Salvar equipe'}
          </button>

          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.deleteBoardBtn}
              onClick={() => void deleteActiveBoard()}
              disabled={!activeViewId}
              title={activeViewId ? 'Excluir quadro salvo selecionado' : 'Selecione um quadro salvo no menu'}
            >
              Excluir quadro
            </button>
            <button type="button" className="btn-ghost" onClick={clearBoard}>
              Limpar
            </button>
          </div>

          <span className={styles.status} aria-live="polite">
            {loading
              ? 'Carregando…'
              : savingSnapshot
                ? 'Salvando…'
                : saving
                  ? 'Sincronizando…'
                  : activeViewId
                    ? 'Versão salva'
                    : savedAt
                      ? 'Sincronizado'
                      : 'Pronto'}
          </span>
        </div>
      </div>

      {activeViewId && (
        <p className={styles.viewBanner}>
          Visualizando versão salva ·{' '}
          <button type="button" className={styles.viewBannerLink} onClick={() => void loadLiveBoard()}>
            Voltar ao ao vivo
          </button>
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div
        ref={surfaceRef}
        className={`${styles.surface} ${styles[`cursor_${tool}`]} ${panning ? styles.panning : ''} ${toolWheel ? styles.surfaceWheelOpen : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(event) => event.preventDefault()}
      >
        {tool === 'link' && (
          <div className={styles.linkHintOverlay}>
            Clique numa bola azul e arraste até outra nota · Esc cancela
          </div>
        )}
        {toolWheel && (
          <div
            className={styles.toolWheel}
            style={{ left: toolWheel.x, top: toolWheel.y }}
            aria-label="Roleta de ferramentas"
          >
            <svg
              className={styles.toolWheelSvg}
              viewBox={`0 0 ${TOOL_WHEEL_SIZE} ${TOOL_WHEEL_SIZE}`}
              aria-hidden
            >
              {TOOL_WHEEL_SECTORS.map((sector) => {
                const active = toolWheel.hoverTool === sector.id;
                return (
                  <path
                    key={sector.id}
                    d={describeDonutSector(
                      TOOL_WHEEL_CENTER,
                      TOOL_WHEEL_CENTER,
                      TOOL_WHEEL_INNER,
                      TOOL_WHEEL_OUTER,
                      sector.start,
                      sector.end,
                    )}
                    className={active ? styles.toolWheelSectorActive : styles.toolWheelSector}
                  />
                );
              })}
              <circle
                cx={TOOL_WHEEL_CENTER}
                cy={TOOL_WHEEL_CENTER}
                r={TOOL_WHEEL_OUTER}
                className={styles.toolWheelOuterRing}
              />
              <circle
                cx={TOOL_WHEEL_CENTER}
                cy={TOOL_WHEEL_CENTER}
                r={TOOL_WHEEL_INNER}
                className={styles.toolWheelInnerDisc}
              />
            </svg>
            {TOOL_WHEEL_SECTORS.map((sector) => {
              const rad = (sector.angle * Math.PI) / 180;
              const offsetX = Math.cos(rad) * TOOL_WHEEL_LABEL_RADIUS;
              const offsetY = Math.sin(rad) * TOOL_WHEEL_LABEL_RADIUS;
              const active = toolWheel.hoverTool === sector.id;
              return (
                <span
                  key={sector.id}
                  className={`${styles.toolWheelLabel} ${active ? styles.toolWheelLabelActive : ''}`}
                  style={{ transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))` }}
                >
                  <span className={styles.toolWheelGlyph} aria-hidden>
                    {sector.glyph}
                  </span>
                  {sector.label}
                </span>
              );
            })}
            <div className={styles.toolWheelCenter}>
              <span className={styles.toolWheelCenterGlyph} aria-hidden>
                {TOOL_WHEEL_SECTORS.find((sector) => sector.id === toolWheel.hoverTool)?.glyph}
              </span>
              <span className={styles.toolWheelCenterLabel}>
                {TOOL_WHEEL_SECTORS.find((sector) => sector.id === toolWheel.hoverTool)?.label}
              </span>
            </div>
          </div>
        )}
        <div
          className={styles.world}
          style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}
        >
          <svg className={styles.inkLayer} aria-hidden>
            {scene.elements.map((el) =>
              el.type === 'stroke' ? (
                <path
                  key={el.id}
                  d={strokeToPath(el.points)}
                  stroke={el.color}
                  strokeWidth={el.width}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null,
            )}

            {draftStroke.length > 1 && (
              <path
                d={strokeToPath(draftStroke)}
                stroke={penColor}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            )}
          </svg>

          {marqueeRect && (marqueeRect.width > 0 || marqueeRect.height > 0) && (
            <div
              className={styles.marquee}
              style={{
                left: marqueeRect.x,
                top: marqueeRect.y,
                width: marqueeRect.width,
                height: marqueeRect.height,
              }}
            />
          )}

          {scene.elements.map((el) => {
            if (el.type === 'image') {
              return (
                <div
                  key={el.id}
                  className={`${styles.imageWrap} ${isSelected(el.id) ? styles.objectSelected : ''}`}
                  style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    selectElement(el.id, e.shiftKey);
                    startElementDrag(el.id, clientToWorld(e.clientX, e.clientY));
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerUp={() => finishElementDrag()}
                >
                  <img src={el.src} alt="" className={styles.boardImage} draggable={false} />
                </div>
              );
            }

            if (el.type === 'sticky') {
              return (
                <div
                  key={el.id}
                  className={`${styles.sticky} ${appearingStickyIds.has(el.id) ? styles.stickyAppear : ''} ${isSelected(el.id) ? styles.objectSelected : ''}`}
                  style={{
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    background: el.color,
                  }}
                  onAnimationEnd={() => clearStickyAppear(el.id)}
                >
                  <div className={styles.stickyInner}>
                    <div
                      className={styles.stickyHandle}
                      title="Arraste para mover"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        selectElement(el.id, e.shiftKey);
                        startElementDrag(el.id, clientToWorld(e.clientX, e.clientY));
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                      onPointerUp={() => finishElementDrag()}
                    >
                      <div className={styles.stickyHandleMain}>
                        <span className={styles.stickyHandleGrip} aria-hidden />
                        <span className={styles.stickyHandleLabel}>Mover</span>
                      </div>
                      {isSelected(el.id) && (
                        <button
                          type="button"
                          className={styles.stickyDeleteInline}
                          aria-label="Excluir nota"
                          title="Excluir"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            deleteElement(el.id);
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <textarea
                    ref={(node) => {
                      if (node) stickyInputRefs.current.set(el.id, node);
                      else stickyInputRefs.current.delete(el.id);
                    }}
                    className={`${styles.stickyInput} ${editingStickyId !== el.id ? styles.stickyInputReadOnly : ''}`}
                    value={el.text}
                    placeholder="Duplo clique para escrever…"
                    readOnly={editingStickyId !== el.id}
                    tabIndex={editingStickyId === el.id ? 0 : -1}
                    onChange={(e) => updateStickyText(el.id, e.target.value)}
                    onBlur={() => {
                      if (editingStickyId === el.id) setEditingStickyId(null);
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (editingStickyId !== el.id) {
                        e.preventDefault();
                        selectElement(el.id, e.shiftKey);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      beginStickyEdit(el.id);
                    }}
                  />
                  </div>
                  {renderStickyResizeHandles(el.id)}
                  {renderStickyLinkAnchors(el.id)}
                </div>
              );
            }

            return null;
          })}

          <svg className={styles.connectorLayer} aria-hidden>
            <defs>
              <marker
                id="nexus-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="#93c5fd" />
              </marker>
              <marker
                id="nexus-arrow-selected"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="#fbbf24" />
              </marker>
            </defs>

            {linkDraft && (
              <path
                d={connectorCurvePath(linkDraft.start, linkDraft.end)}
                className={styles.connectorDraft}
                markerEnd="url(#nexus-arrow)"
              />
            )}

            {connectors.map(({ connector, d }) => {
              const selected = isSelected(connector.id);
              return (
                <g key={connector.id}>
                  <path
                    d={d}
                    className={styles.connectorHit}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      selectElement(connector.id, e.shiftKey);
                      setEditingStickyId(null);
                      clearLinkDrag();
                    }}
                  />
                  <path
                    d={d}
                    className={`${styles.connector} ${selected ? styles.connectorSelected : ''}`}
                    markerEnd={selected ? 'url(#nexus-arrow-selected)' : 'url(#nexus-arrow)'}
                    pointerEvents="none"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <p className={styles.hint}>
        Salvar equipe · Clique direito: roleta · Seta: bola azul → arraste · Shift+arrastar move ·
        Duplo clique escreve · Scroll zoom.
      </p>
        </div>
      </div>
    </div>
  );
}
