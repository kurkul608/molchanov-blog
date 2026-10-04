import { useEffect, useState } from 'react';
import { applyTheme, readTheme, type Theme } from '../model/theme';
import styles from './theme-toggle.module.css';

/** Client island (hydrated with `client:idle`): it needs `localStorage` and a click handler. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={theme ? `Switch to ${next} theme` : 'Switch theme'}
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
    >
      <span aria-hidden="true">{theme === 'dark' ? 'Light' : theme === 'light' ? 'Dark' : 'Theme'}</span>
    </button>
  );
}
