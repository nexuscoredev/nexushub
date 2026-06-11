import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import {
  DEV_CHECKLIST_STORAGE_KEY,
  DEV_SNIPPETS,
  DEV_STAGES,
  devChecklistItemKey,
  loadWhiteboardEmbedUrl,
  miroBoardViewUrl,
  saveWhiteboardEmbedUrl,
  toMiroLiveEmbedUrl,
} from '../data/painelDesenvolvimento';
import styles from './DesenvolvimentoPage.module.css';

type DevTab = 'fluxo' | 'checklists' | 'codigos' | 'quadro';

function loadChecked(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(DEV_CHECKLIST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, boolean>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function saveChecked(checked: Record<string, boolean>) {
  localStorage.setItem(DEV_CHECKLIST_STORAGE_KEY, JSON.stringify(checked));
}

export function DesenvolvimentoPage() {
  const [tab, setTab] = useState<DevTab>('fluxo');
  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [boardInput, setBoardInput] = useState('');
  const [boardEmbedUrl, setBoardEmbedUrl] = useState(loadWhiteboardEmbedUrl);
  const [boardError, setBoardError] = useState<string | null>(null);

  useEffect(() => {
    saveChecked(checked);
  }, [checked]);

  const toggleItem = useCallback((key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const stageProgress = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const stage of DEV_STAGES) {
      let done = 0;
      stage.checklist.forEach((_, index) => {
        if (checked[devChecklistItemKey(stage.id, index)]) done++;
      });
      map.set(stage.id, { done, total: stage.checklist.length });
    }
    return map;
  }, [checked]);

  const copySnippet = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    } catch {
      /* ignore */
    }
  };

  const saveBoardLink = () => {
    const embed = toMiroLiveEmbedUrl(boardInput);
    if (!embed) {
      setBoardError(
        'Cole o link do quadro Miro (miro.com/app/board/...). O webwhiteboard.com abre fora do Hub — use Compartilhar e cole o link do board aqui.',
      );
      return;
    }
    setBoardError(null);
    setBoardEmbedUrl(embed);
    saveWhiteboardEmbedUrl(embed);
    setBoardInput('');
  };

  const activeBoardEmbed = boardEmbedUrl || toMiroLiveEmbedUrl(boardInput);

  return (
    <div>
      <PageHeader
        badge="// DEV"
        title="Painel de Desenvolvimento"
        subtitle="Fluxo NEXUS, checklists, códigos para o Cursor e quadro colaborativo da equipe."
      />

      <div className={styles.tabs}>
        <button
          type="button"
          className={`tab ${tab === 'fluxo' ? 'active' : ''}`}
          onClick={() => setTab('fluxo')}
        >
          Fluxo
        </button>
        <button
          type="button"
          className={`tab ${tab === 'checklists' ? 'active' : ''}`}
          onClick={() => setTab('checklists')}
        >
          Checklists
        </button>
        <button
          type="button"
          className={`tab ${tab === 'codigos' ? 'active' : ''}`}
          onClick={() => setTab('codigos')}
        >
          Códigos
        </button>
        <button
          type="button"
          className={`tab ${tab === 'quadro' ? 'active' : ''}`}
          onClick={() => setTab('quadro')}
        >
          Quadro
        </button>
      </div>

      {tab === 'fluxo' && (
        <div className={styles.timeline}>
          {DEV_STAGES.map((stage) => (
            <article key={stage.id} className={styles.stageCard}>
              <span className={styles.stageOrder} aria-hidden>
                {stage.order}
              </span>
              <div className={styles.stageBody}>
                <h2 className={styles.stageTitle}>{stage.title}</h2>
                <p className={styles.stageSummary}>{stage.summary}</p>
                <div className={styles.toolRow}>
                  {stage.tools.map((tool) => (
                    <span key={tool} className={styles.toolTag}>
                      {tool}
                    </span>
                  ))}
                </div>
                <ul className={styles.stageChecklist}>
                  {stage.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'checklists' && (
        <div className={styles.checklistGrid}>
          {DEV_STAGES.map((stage) => {
            const progress = stageProgress.get(stage.id) ?? { done: 0, total: stage.checklist.length };
            return (
              <section key={stage.id} className={styles.checklistCard}>
                <div className={styles.checklistCardHead}>
                  <h2 className={styles.checklistCardTitle}>
                    {stage.order}. {stage.title}
                  </h2>
                  <span className={styles.checklistProgress}>
                    {progress.done}/{progress.total}
                  </span>
                </div>
                <ul className={styles.checklistItems}>
                  {stage.checklist.map((item, index) => {
                    const key = devChecklistItemKey(stage.id, index);
                    const isDone = Boolean(checked[key]);
                    return (
                      <li key={key}>
                        <label
                          className={`${styles.checklistItem} ${isDone ? styles.checklistItemDone : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => toggleItem(key)}
                          />
                          <span>{item}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {tab === 'codigos' && (
        <div className={styles.snippetList}>
          {DEV_SNIPPETS.map((snippet) => (
            <article key={snippet.id} className={styles.snippetCard}>
              <div className={styles.snippetHead}>
                <div>
                  <h2 className={styles.snippetTitle}>{snippet.title}</h2>
                  <p className={styles.snippetDesc}>{snippet.description}</p>
                </div>
                <button
                  type="button"
                  className={`${styles.copyBtn} ${copiedId === snippet.id ? styles.copyBtnDone : ''}`}
                  onClick={() => void copySnippet(snippet.id, snippet.content)}
                >
                  {copiedId === snippet.id ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <div className={styles.snippetTags}>
                {snippet.tags.map((tag) => (
                  <span key={tag} className={styles.toolTag}>
                    {tag}
                  </span>
                ))}
              </div>
              <pre className={styles.snippetPre}>{snippet.content}</pre>
            </article>
          ))}
        </div>
      )}

      {tab === 'quadro' && (
        <div className={styles.whiteboardPanel}>
          <div className={styles.whiteboardToolbar}>
            <div className={styles.whiteboardIntro}>
              <p className={styles.whiteboardLead}>
                Quadro colaborativo da equipe (Miro / Web Whiteboard). Crie ou abra um board,
                compartilhe o link e cole abaixo para fixar no Hub.
              </p>
            </div>
            <div className={styles.whiteboardActions}>
              <a
                href="https://webwhiteboard.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Novo quadro
              </a>
              {activeBoardEmbed ? (
                <a
                  href={miroBoardViewUrl(activeBoardEmbed)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                >
                  Abrir em nova aba
                </a>
              ) : null}
            </div>
            <div className={styles.whiteboardLinkRow}>
              <input
                className="input"
                type="url"
                placeholder="Cole o link: https://miro.com/app/board/..."
                value={boardInput}
                onChange={(e) => {
                  setBoardInput(e.target.value);
                  if (boardError) setBoardError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveBoardLink();
                }}
                aria-label="Link do quadro Miro"
              />
              <button type="button" className="btn-primary" onClick={saveBoardLink}>
                Salvar quadro
              </button>
            </div>
            {boardError && <p className={styles.whiteboardError}>{boardError}</p>}
            <p className={styles.whiteboardHint}>
              O site webwhiteboard.com não permite iframe externo. Após criar o quadro, use{' '}
              <strong>Compartilhar</strong> e cole o link do board Miro — o Hub embute aqui para
              todos com o mesmo link salvo (ou defina{' '}
              <code>VITE_NEXUS_WHITEBOARD_EMBED</code> na Vercel para a equipe).
            </p>
          </div>

          {activeBoardEmbed ? (
            <div className={styles.whiteboardFrameWrap}>
              <iframe
                title="Quadro NEXUS — Miro"
                src={activeBoardEmbed}
                className={styles.whiteboardFrame}
                allow="fullscreen; clipboard-read; clipboard-write"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className={styles.whiteboardEmpty}>
              <p>Nenhum quadro configurado.</p>
              <p>Clique em <strong>Novo quadro</strong>, crie o board e cole o link acima.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
