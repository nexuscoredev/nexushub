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
  connectorCurvePath,
  connectorEndpoints,
  fetchDevWhiteboard,
  findElementsInRect,
  isMovableElement,
  moveMovable,
  newElementId,
  normalizeRect,
  readClipboardImage,
  resizeSticky,
  saveDevWhiteboard,
  sceneWithoutElement,
  sceneWithoutElements,
  strokeToPath,
  subscribeDevWhiteboard,
  type WhiteboardConnector,
  type WhiteboardImage,
  type WhiteboardPoint,
  type WhiteboardScene,
  type WhiteboardSticky,
  type WhiteboardTool,
  type ConnectorAnchor,
} from '../../lib/devWhiteboard';
import styles from './HubDevWhiteboard.module.css';

const STICKY_W = 220;
const STICKY_H = 150;
const STICKY_MIN_W = 140;
const STICKY_MIN_H = 100;
const STICKY_MAX_W = 520;
const STICKY_MAX_H = 420;
const MARQUEE_MIN_DRAG = 6;
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

interface HubDevWhiteboardProps {
  fullHeight?: boolean;
}

export function HubDevWhiteboard({ fullHeight = false }: HubDevWhiteboardProps) {
  const { user } = useAuth();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<WhiteboardScene>(DEFAULT_WHITEBOARD_SCENE);
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
  const [historyPast, setHistoryPast] = useState<WhiteboardScene[]>([]);
  const [historyFuture, setHistoryFuture] = useState<WhiteboardScene[]>([]);
  const [tool, setTool] = useState<WhiteboardTool>('select');
  const [penColor, setPenColor] = useState<string>(PEN_COLORS[0]);
  const [stickyColor, setStickyColor] = useState<string>(STICKY_COLORS[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingStickyId, setEditingStickyId] = useState<string | null>(null);
  const [marquee, setMarquee] = useState<{ start: WhiteboardPoint; end: WhiteboardPoint } | null>(
    null,
  );
  const [linkFromId, setLinkFromId] = useState<string | null>(null);
  const [linkFromAnchor, setLinkFromAnchor] = useState<ConnectorAnchor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftStroke, setDraftStroke] = useState<WhiteboardPoint[]>([]);
  const [panning, setPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  sceneRef.current = scene;

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
      setLinkFromId(null);
      setLinkFromAnchor(null);
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
      setLinkFromId(null);
      setLinkFromAnchor(null);
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
      if (lastRemoteAtRef.current && updatedAt <= lastRemoteAtRef.current) return;
      lastRemoteAtRef.current = updatedAt;
      setSavedAt(updatedAt);
      setScene(remoteScene);
      clearSelection();
      setLinkFromId(null);
      setLinkFromAnchor(null);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [clearSelection]);

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
      setSelectedIds([sticky.id]);
    },
    [applyScene, stickyColor],
  );

  const beginStickyEdit = useCallback((id: string) => {
    setSelectedIds([id]);
    setEditingStickyId(id);
    setTool('select');
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

  const clearLinkDraft = useCallback(() => {
    setLinkFromId(null);
    setLinkFromAnchor(null);
  }, []);

  const tryLinkElement = useCallback(
    (targetId: string) => {
      const target = sceneRef.current.elements.find((el) => el.id === targetId);
      if (!target || !isMovableElement(target)) return;

      if (!linkFromId) {
        setLinkFromId(targetId);
        setLinkFromAnchor(null);
        setSelectedIds([targetId]);
        return;
      }

      if (linkFromId === targetId) {
        clearLinkDraft();
        return;
      }

      const exists = sceneRef.current.elements.some(
        (el) =>
          el.type === 'connector' &&
          ((el.fromId === linkFromId && el.toId === targetId) ||
            (el.fromId === targetId && el.toId === linkFromId)),
      );
      if (!exists) {
        const connector: WhiteboardConnector = {
          id: newElementId(),
          type: 'connector',
          fromId: linkFromId,
          toId: targetId,
          ...(linkFromAnchor ? { fromAnchor: linkFromAnchor } : {}),
        };
        applyScene({
          ...sceneRef.current,
          elements: [...sceneRef.current.elements, connector],
        });
      }
      clearLinkDraft();
      setSelectedIds([targetId]);
    },
    [applyScene, clearLinkDraft, linkFromAnchor, linkFromId],
  );

  const tryLinkAnchor = useCallback(
    (targetId: string, anchor: ConnectorAnchor) => {
      const target = sceneRef.current.elements.find((el) => el.id === targetId);
      if (!target || !isMovableElement(target)) return;

      if (!linkFromId) {
        setLinkFromId(targetId);
        setLinkFromAnchor(anchor);
        setSelectedIds([targetId]);
        setTool('link');
        return;
      }

      if (linkFromId === targetId && linkFromAnchor === anchor) {
        clearLinkDraft();
        return;
      }

      const exists = sceneRef.current.elements.some(
        (el) =>
          el.type === 'connector' &&
          ((el.fromId === linkFromId && el.toId === targetId) ||
            (el.fromId === targetId && el.toId === linkFromId)),
      );
      if (!exists) {
        const connector: WhiteboardConnector = {
          id: newElementId(),
          type: 'connector',
          fromId: linkFromId,
          toId: targetId,
          ...(linkFromAnchor ? { fromAnchor: linkFromAnchor } : {}),
          toAnchor: anchor,
        };
        applyScene({
          ...sceneRef.current,
          elements: [...sceneRef.current.elements, connector],
        });
      }
      clearLinkDraft();
      setSelectedIds([targetId]);
    },
    [applyScene, clearLinkDraft, linkFromAnchor, linkFromId],
  );

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
    const world = clientToWorld(event.clientX, event.clientY);

    if (tool === 'hand' || event.button === 1 || (tool === 'select' && event.shiftKey)) {
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

    if (tool === 'pen') {
      setDraftStroke([world]);
      clearSelection();
      clearLinkDraft();
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (tool === 'select') {
      clearLinkDraft();
      setMarquee({ start: world, end: world });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
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
    if (panning) {
      finishPan();
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
      if (linkFromId === id) clearLinkDraft();
    },
    [applyScene, clearLinkDraft, editingStickyId, linkFromId],
  );

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    applyScene(sceneWithoutElements(sceneRef.current, selectedIds));
    clearSelection();
    clearLinkDraft();
  }, [applyScene, clearLinkDraft, clearSelection, selectedIds]);

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
    clearLinkDraft();
  };

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
        clearLinkDraft();
        setEditingStickyId(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clearLinkDraft, deleteSelected, pasteImageFromClipboard, redo, selectedIds, undo]);

  const showLinkAnchors = () => tool === 'link' || linkFromId !== null;

  const showStickyResize = (elementId: string) =>
    isSelected(elementId) && tool !== 'link' && linkFromId === null;

  const anchorLabel: Record<ConnectorAnchor, string> = {
    top: 'topo',
    right: 'direita',
    bottom: 'baixo',
    left: 'esquerda',
  };

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
          setTool('select');
          startStickyResize(elementId, handle, clientToWorld(e.clientX, e.clientY));
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={() => finishStickyResize()}
      />
    ));
  };

  const renderLinkAnchors = (elementId: string) => {
    if (!showLinkAnchors()) return null;
    return (
      <div className={styles.linkAnchors}>
        {CONNECTOR_ANCHORS.map((anchor) => (
          <button
            key={anchor}
            type="button"
            className={`${styles.linkAnchor} ${styles[`linkAnchor_${anchor}`]} ${
              linkFromId === elementId && linkFromAnchor === anchor ? styles.linkAnchorActive : ''
            }`}
            aria-label={`Conectar ${anchorLabel[anchor]}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              tryLinkAnchor(elementId, anchor);
            }}
          />
        ))}
      </div>
    );
  };

  const connectors = useMemo(() => {
    const byId = new Map(scene.elements.map((el) => [el.id, el]));
    return scene.elements
      .filter((el): el is WhiteboardConnector => el.type === 'connector')
      .map((connector) => {
        const from = byId.get(connector.fromId);
        const to = byId.get(connector.toId);
        if (!from || !to || !isMovableElement(from) || !isMovableElement(to)) return null;
        const { from: fromPoint, to: toPoint } = connectorEndpoints(connector, from, to);
        return { connector, d: connectorCurvePath(fromPoint, toPoint) };
      })
      .filter(Boolean) as { connector: WhiteboardConnector; d: string }[];
  }, [scene.elements]);

  const marqueeRect = marquee ? normalizeRect(marquee.start, marquee.end) : null;

  const { panX, panY, zoom } = scene.viewport;

  return (
    <div className={`${styles.root} ${fullHeight ? styles.rootFull : ''}`}>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup} role="group" aria-label="Ferramentas">
          {(
            [
              ['select', 'Selecionar'],
              ['pen', 'Caneta'],
              ['sticky', 'Nota'],
              ['link', 'Seta'],
              ['hand', 'Mover'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`${styles.toolBtn} ${tool === id ? styles.toolBtnActive : ''}`}
              onClick={() => {
                setTool(id);
                if (id !== 'link') clearLinkDraft();
              }}
              title={label}
            >
              {label}
            </button>
          ))}
        </div>

        {tool === 'pen' && (
          <div className={styles.colorRow} role="group" aria-label="Cor da caneta">
            {PEN_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`${styles.colorSwatch} ${penColor === color ? styles.colorSwatchActive : ''}`}
                style={{ background: color }}
                onClick={() => setPenColor(color)}
                aria-label={`Cor ${color}`}
              />
            ))}
          </div>
        )}

        {tool === 'sticky' && (
          <div className={styles.colorRow} role="group" aria-label="Cor da nota">
            {STICKY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`${styles.colorSwatch} ${stickyColor === color ? styles.colorSwatchActive : ''}`}
                style={{ background: color }}
                onClick={() => setStickyColor(color)}
                aria-label={`Nota ${color}`}
              />
            ))}
          </div>
        )}

        {tool === 'link' && (
          <span className={styles.linkHint}>
            {linkFromId ? 'Clique na bola de destino · Esc cancela' : 'Clique numa bola azul, depois na outra nota'}
          </span>
        )}

        <div className={styles.toolbarSpacer} />

        <button type="button" className="btn-ghost" onClick={undo} disabled={historyPast.length === 0}>
          Desfazer
        </button>
        <button type="button" className="btn-ghost" onClick={redo} disabled={historyFuture.length === 0}>
          Refazer
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={deleteSelected}
          disabled={selectedIds.length === 0}
        >
          Excluir
        </button>
        <button type="button" className="btn-ghost" onClick={clearBoard}>
          Limpar
        </button>
        <span className={styles.status}>
          {loading ? 'Carregando…' : saving ? 'Salvando…' : savedAt ? 'Sincronizado' : 'Pronto'}
        </span>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div
        ref={surfaceRef}
        className={`${styles.surface} ${styles[`cursor_${tool}`]} ${panning ? styles.panning : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className={styles.world}
          style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}
        >
          <svg className={styles.inkLayer} aria-hidden>
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
            </defs>

            {connectors.map(({ connector, d }) => (
              <path
                key={connector.id}
                d={d}
                className={`${styles.connector} ${isSelected(connector.id) ? styles.connectorSelected : ''}`}
                markerEnd="url(#nexus-arrow)"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  selectElement(connector.id, e.shiftKey);
                  setTool('select');
                }}
              />
            ))}

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
                  className={`${styles.imageWrap} ${isSelected(el.id) ? styles.objectSelected : ''} ${linkFromId === el.id ? styles.linkSource : ''}`}
                  style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (tool === 'link') {
                      tryLinkElement(el.id);
                      return;
                    }
                    selectElement(el.id, e.shiftKey);
                    setTool('select');
                    startElementDrag(el.id, clientToWorld(e.clientX, e.clientY));
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerUp={() => finishElementDrag()}
                >
                  <img src={el.src} alt="" className={styles.boardImage} draggable={false} />
                  {renderLinkAnchors(el.id)}
                </div>
              );
            }

            if (el.type === 'sticky') {
              return (
                <div
                  key={el.id}
                  className={`${styles.sticky} ${isSelected(el.id) ? styles.objectSelected : ''} ${linkFromId === el.id ? styles.linkSource : ''}`}
                  style={{
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    background: el.color,
                  }}
                >
                  <div className={styles.stickyInner}>
                    <div
                      className={styles.stickyHandle}
                      title="Arraste para mover"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        if (tool === 'link') {
                          tryLinkElement(el.id);
                          return;
                        }
                        selectElement(el.id, e.shiftKey);
                        setTool('select');
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
                        setTool('select');
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      beginStickyEdit(el.id);
                    }}
                  />
                  </div>
                  {renderStickyResizeHandles(el.id)}
                  {renderLinkAnchors(el.id)}
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      <p className={styles.hint}>
        Ctrl+Z desfazer · Ctrl+Y refazer · Ctrl+V colar imagem · Seleção: arraste no vazio · Bolas azuis
        ligam setas · Barra Mover · Alças nas bordas redimensionam · Duplo clique escreve · Scroll zoom.
      </p>
    </div>
  );
}
