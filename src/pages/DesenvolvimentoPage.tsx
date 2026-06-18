import { useCallback, useEffect, useMemo, useState } from 'react';
import { HubDevWhiteboard } from '../components/devwhiteboard/HubDevWhiteboard';
import { PageHeader } from '../components/PageHeader';
import {
  DEV_ALL_CHECKLIST_STAGES,
  DEV_CHECKLIST_STORAGE_KEY,
  DEV_FLUXO_WHITEBOARD_IMAGE,
  DEV_KANBAN,
  DEV_PDCA_STEPS,
  DEV_PIPELINE_STAGES,
  DEV_PLANNING_IDEAS,
  DEV_PLANNING_STATUS_LABEL,
  DEV_SNIPPETS,
  DEV_STAGES,
  devChecklistItemKey,
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

  useEffect(() => {
    saveChecked(checked);
  }, [checked]);

  useEffect(() => {
    if (tab !== 'quadro') return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [tab]);

  const toggleItem = useCallback((key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const stageProgress = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const stage of DEV_ALL_CHECKLIST_STAGES) {
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

  return (
    <div className={tab === 'quadro' ? styles.pageQuadro : undefined}>
      <PageHeader
        badge="// DEV"
        title="Painel de Desenvolvimento"
        subtitle={
          tab === 'quadro'
            ? undefined
            : 'Fluxo, checklists e códigos da equipe.'
        }
        compact={tab === 'quadro'}
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
        <div className={styles.fluxo}>
          <section className={styles.fluxoSection} aria-labelledby="fluxo-metodologias">
            <h2 id="fluxo-metodologias" className={styles.fluxoSectionTitle}>
              Metodologias
            </h2>
            <div className={styles.pdcaGrid}>
              {DEV_PDCA_STEPS.map((step) => (
                <article key={step.id} className={styles.pdcaCard}>
                  <span className={styles.pdcaLetter} aria-hidden>
                    {step.letter}
                  </span>
                  <div className={styles.pdcaBody}>
                    <h3 className={styles.pdcaTitle}>
                      {step.verb} <span className={styles.pdcaEn}>({step.title})</span>
                    </h3>
                    <p className={styles.pdcaSummary}>{step.summary}</p>
                    <span className={styles.toolTag}>{step.tool}</span>
                  </div>
                </article>
              ))}
            </div>
            <article className={styles.kanbanCard}>
              <h3 className={styles.kanbanTitle}>{DEV_KANBAN.title}</h3>
              <p className={styles.kanbanSub}>{DEV_KANBAN.subtitle}</p>
              <p className={styles.kanbanSummary}>{DEV_KANBAN.summary}</p>
            </article>
          </section>

          <section className={styles.fluxoSection} aria-labelledby="fluxo-pipeline">
            <h2 id="fluxo-pipeline" className={styles.fluxoSectionTitle}>
              Pipeline comercial → entrega
            </h2>
            <p className={styles.fluxoLead}>
              Do marketing ao contrato, depois Dev + QA e manutenção com melhoria de experiência.
            </p>
            <div className={styles.pipeline}>
              {DEV_PIPELINE_STAGES.map((stage, index) => (
                <div key={stage.id} className={styles.pipelineStep}>
                  <article className={`${styles.stageCard} ${styles.pipelineCard}`}>
                    <span className={styles.stageOrder} aria-hidden>
                      {stage.order}
                    </span>
                    <div className={styles.stageBody}>
                      <h3 className={styles.stageTitle}>{stage.title}</h3>
                      <p className={styles.stageSummary}>{stage.summary}</p>
                      <div className={styles.toolRow}>
                        {stage.tools.map((tool) => (
                          <span key={tool} className={styles.toolTag}>
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                  {index < DEV_PIPELINE_STAGES.length - 1 ? (
                    <span className={styles.pipelineArrow} aria-hidden>
                      ↓
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            <figure className={styles.whiteboardFig}>
              <img
                src={DEV_FLUXO_WHITEBOARD_IMAGE}
                alt="Quadro físico da equipe: PDCA, Kanban e pipeline comercial até manutenção"
                className={styles.whiteboardImg}
                loading="lazy"
                decoding="async"
              />
              <figcaption className={styles.whiteboardCap}>Referência do quadro da equipe</figcaption>
            </figure>
          </section>

          <section className={styles.fluxoSection} aria-labelledby="fluxo-planejamento">
            <h2 id="fluxo-planejamento" className={styles.fluxoSectionTitle}>
              Planejamento — Hub
            </h2>
            <ul className={styles.planningList}>
              {DEV_PLANNING_IDEAS.map((idea) => (
                <li key={idea.id} className={styles.planningItem}>
                  <div className={styles.planningHead}>
                    <span className={styles.planningArea}>{idea.area}</span>
                    <span className={`${styles.planningStatus} ${styles[`planningStatus${idea.status}`]}`}>
                      {DEV_PLANNING_STATUS_LABEL[idea.status]}
                    </span>
                  </div>
                  <p className={styles.planningTitle}>{idea.title}</p>
                  <p className={styles.planningNotes}>{idea.notes}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.fluxoSection} aria-labelledby="fluxo-tecnico">
            <h2 id="fluxo-tecnico" className={styles.fluxoSectionTitle}>
              Stack técnica
            </h2>
            <p className={styles.fluxoLead}>Infraestrutura e publicação de cada entrega.</p>
            <div className={styles.timeline}>
              {DEV_STAGES.map((stage) => (
                <article key={stage.id} className={styles.stageCard}>
                  <span className={styles.stageOrder} aria-hidden>
                    {stage.order}
                  </span>
                  <div className={styles.stageBody}>
                    <h3 className={styles.stageTitle}>{stage.title}</h3>
                    <p className={styles.stageSummary}>{stage.summary}</p>
                    <div className={styles.toolRow}>
                      {stage.tools.map((tool) => (
                        <span key={tool} className={styles.toolTag}>
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'checklists' && (
        <div className={styles.checklistGrid}>
          <p className={styles.checklistIntro}>
            Pipeline comercial e stack técnica — marque conforme cada etapa avança.
          </p>
          {DEV_ALL_CHECKLIST_STAGES.map((stage) => {
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
              <pre className={styles.snippetPre}>{snippet.content}</pre>
            </article>
          ))}
        </div>
      )}

      {tab === 'quadro' && (
        <div className={styles.quadroWrap}>
          <HubDevWhiteboard fullHeight />
        </div>
      )}
    </div>
  );
}
