import type { ReactNode } from 'react';
import styles from './callout.module.css';
import { CALLOUT_LABELS, isCalloutType } from './config';

export interface CalloutProps {
  type?: string;
  title?: string;
  children?: ReactNode;
}

export function Callout({ type, title, children }: CalloutProps) {
  const kind = isCalloutType(type) ? type : 'note';
  const label = title ?? CALLOUT_LABELS[kind];
  return (
    <aside className={styles.callout} data-type={kind} aria-label={label}>
      <p className={styles.label}>{label}</p>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
