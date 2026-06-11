import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  DEFAULT_WHITEBOARD_SCENE,
  PEN_COLORS,
  STICKY_COLORS,
  fetchDevWhiteboard,
  newElementId,
  saveDevWhiteboard,
  strokeToPath,
  subscribeDevWhiteboard,
  type WhiteboardPoint,
  type WhiteboardScene,
  type WhiteboardSticky,
  type WhiteboardTool,
} from '../../lib/devWhiteboard';
import styles from './HubDevWhiteboard.module.css';

const STICKY_W = 220;
const STICKY_H = 150;

function cloneScene(scene: WhiteboardScene): WhiteboardScene {
  return structuredClone(scene);
}

export function HubDevWhiteboard() {
  const { user } = useAuth();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<number | null>(null);
  const skipRemoteUntilRef = useRef(0);
  const lastRemoteAtRef = useRef<string | null>(null);

  const [scene, setScene] = useState<WhiteboardScene>(DEFAULT_WHITEBOARD_SCENE);
  const [tool, setTool] = useState<WhiteboardTool>('pen');
  const [penColor, setPenColor] = useState<string>(PEN_COLORS[0]);
  const [stickyColor, setStickyColor] = useState<string>(STICKY_COLORS[0]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftStroke, setDraftStroke] = useState<WhiteboardPoint[]>([]);
  const [panning, setPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

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

  const commitScene = useCallback(
    (updater: (prev: WhiteboardScene) => WhiteboardScene) => {
      setScene((prev) => {
        const next = updater(prev);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  useEffect(() => {
    let cancelled = false;
    void fetchDevWhiteboard()
      .then(({ scene: loaded, updatedAt }) => {
        if (cancelled) return;
        setScene(loaded);
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
      setSelectedId(null);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  const clientToWorld = useCallback(
    (clientX: number, clientY: number): WhiteboardPoint => {
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const { panX, panY, zoom } = scene.viewport;
      return {
        x: (clientX - rect.left - panX) / zoom,
        y: (clientY - rect.top - panY) / zoom,
      };
    },
    [scene.viewport],
  );

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
      commitScene((prev) => ({
        ...prev,
        elements: [...prev.elements, sticky],
      }));
      setSelectedId(sticky.id);
      setTool('select');
    },
    [commitScene, stickyColor],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (loading) return;
    const world = clientToWorld(event.clientX, event.clientY);

    if (tool === 'hand' || event.button === 1 || (tool === 'select' && event.shiftKey)) {
      setPanning(true);
      panStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        panX: scene.viewport.panX,
        panY: scene.viewport.panY,
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
      setSelectedId(null);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (tool === 'select') {
      setSelectedId(null);
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

    if (tool === 'pen' && draftStroke.length > 0) {
      const world = clientToWorld(event.clientX, event.clientY);
      setDraftStroke((prev) => [...prev, world]);
    }
  };

  const finishPan = useCallback(() => {
    if (!panning) return;
    setPanning(false);
    commitScene((prev) => cloneScene(prev));
  }, [commitScene, panning]);

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (panning) {
      finishPan();
      return;
    }

    if (tool === 'pen' && draftStroke.length > 1) {
      const stroke = {
        id: newElementId(),
        type: 'stroke' as const,
        points: draftStroke,
        color: penColor,
        width: 2.5,
      };
      commitScene((prev) => ({
        ...prev,
        elements: [...prev.elements, stroke],
      }));
    }
    setDraftStroke([]);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    commitScene((prev) => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        zoom: Math.min(3, Math.max(0.35, prev.viewport.zoom + delta)),
      },
    }));
  };

  const updateStickyText = (id: string, text: string) => {
    commitScene((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id && el.type === 'sticky' ? { ...el, text } : el,
      ),
    }));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    commitScene((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== selectedId),
    }));
    setSelectedId(null);
  };

  const clearBoard = () => {
    if (!window.confirm('Limpar todo o quadro? Esta ação afeta a equipe.')) return;
    commitScene(() => ({
      ...DEFAULT_WHITEBOARD_SCENE,
      viewport: scene.viewport,
    }));
    setSelectedId(null);
  };

  const { panX, panY, zoom } = scene.viewport;

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup} role="group" aria-label="Ferramentas">
          {(
            [
              ['select', 'Selecionar'],
              ['pen', 'Caneta'],
              ['sticky', 'Nota'],
              ['hand', 'Mover'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`${styles.toolBtn} ${tool === id ? styles.toolBtnActive : ''}`}
              onClick={() => setTool(id)}
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

        <div className={styles.toolbarSpacer} />

        <button
          type="button"
          className="btn-ghost"
          onClick={deleteSelected}
          disabled={!selectedId}
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
        onWheel={handleWheel}
      >
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

          {scene.elements.map((el) =>
            el.type === 'sticky' ? (
              <div
                key={el.id}
                className={`${styles.sticky} ${selectedId === el.id ? styles.stickySelected : ''}`}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  background: el.color,
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedId(el.id);
                  setTool('select');
                }}
              >
                <textarea
                  className={styles.stickyInput}
                  value={el.text}
                  placeholder="Escreva aqui…"
                  onChange={(e) => updateStickyText(el.id, e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                />
              </div>
            ) : null,
          )}
        </div>
      </div>

      <p className={styles.hint}>
        Caneta para desenhar · Nota para post-its · Mover para arrastar o quadro · Scroll para zoom ·
        Shift+arrastar também move · Salva automaticamente para toda a equipe.
      </p>
    </div>
  );
}
