import { useMemo, useState } from 'react';
import type { StatusDiarioEntry } from '../../lib/ligeirinhoStatusDiario';
import styles from './ClienteStatusDiario.module.css';

interface ClienteStatusDiarioProps {
  entry: StatusDiarioEntry;
}

function isSameCalendarDay(iso: string, ref = new Date()): boolean {
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function ClienteStatusDiario({ entry }: ClienteStatusDiarioProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set([entry.secoes[0]?.id].filter(Boolean)));

  const isHoje = useMemo(() => isSameCalendarDay(entry.dataIso), [entry.dataIso]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section id="status-hoje" className={styles.wrap} aria-labelledby="status-hoje-title">
      <header className={styles.head}>
        <div className={styles.headCopy}>
          <p className={styles.eyebrow}>
            {entry.produto}
            {isHoje ? <span className={styles.badgeHoje}>Hoje</span> : null}
          </p>
          <h2 id="status-hoje-title" className={styles.title}>
            {entry.titulo}
          </h2>
          <p className={styles.meta}>
            <time dateTime={entry.dataIso}>{entry.dataLabel}</time>
          </p>
        </div>
        <button
          type="button"
          className={styles.expandAll}
          onClick={() => {
            if (openIds.size === entry.secoes.length) setOpenIds(new Set());
            else setOpenIds(new Set(entry.secoes.map((s) => s.id)));
          }}
        >
          {openIds.size === entry.secoes.length ? 'Recolher tudo' : 'Expandir tudo'}
        </button>
      </header>

      <div className={styles.list}>
        {entry.secoes.map((secao, index) => {
          const open = openIds.has(secao.id);
          const panelId = `status-panel-${secao.id}`;
          return (
            <article key={secao.id} className={`${styles.item} ${open ? styles.itemOpen : ''}`}>
              <h3>
                <button
                  type="button"
                  className={styles.trigger}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => toggle(secao.id)}
                >
                  <span className={styles.triggerIndex}>{index + 1}</span>
                  <span className={styles.triggerLabel}>{secao.titulo}</span>
                  <span className={styles.chevron} aria-hidden />
                </button>
              </h3>
              <div id={panelId} className={styles.panel} hidden={!open}>
                {secao.destaque ? <p className={styles.destaque}>{secao.destaque}</p> : null}
                <ul className={styles.itens}>
                  {secao.itens.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>

      {entry.rodape ? <p className={styles.rodape}>{entry.rodape}</p> : null}
    </section>
  );
}
