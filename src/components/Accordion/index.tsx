import { useId, useState, type ReactNode } from 'react';
import styles from './index.module.css';

export type AccordionItem = {
  id: string;
  title: ReactNode;
  content: ReactNode;
};

type AccordionProps = {
  items: AccordionItem[];
  defaultOpenId?: string | null;
};

export function Accordion({ items, defaultOpenId = null }: AccordionProps) {
  const baseId = useId();
  const [current, setCurrent] = useState<string | null>(defaultOpenId);

  const toggle = (id: string) => setCurrent((open) => (open === id ? null : id));

  return (
    <div className={styles.root}>
      {items.map((item) => {
        const open = current === item.id;
        const headId = `${baseId}-h-${item.id}`;
        const panelId = `${baseId}-p-${item.id}`;
        return (
          <div key={item.id} className={styles.item} data-open={open || undefined}>
            <h3 className={styles.heading}>
              <button
                type="button"
                id={headId}
                className={styles.trigger}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
              >
                <span className={styles.title}>{item.title}</span>
                <span className={styles.icon} aria-hidden="true" />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headId}
              className={styles.panel}
              inert={!open}
            >
              <div className={styles.panelInner}>
                <div className={styles.content}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
