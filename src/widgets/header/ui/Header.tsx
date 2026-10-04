import type { ReactNode } from 'react';
import styles from './header.module.css';

const NAV = [
  { href: '/blog/', label: 'Blog' },
  { href: '/projects/', label: 'Projects' },
  { href: '/now/', label: 'Now' },
  { href: '/about/', label: 'About' },
] as const;

export interface HeaderProps {
  siteName: string;
  currentPath: string;
  /** Slot for client islands, for example the theme toggle. */
  children?: ReactNode;
}

export function Header({ siteName, currentPath, children }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles.brand} href="/">
          {siteName}
        </a>
        <nav aria-label="Main">
          <ul className={styles.nav}>
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} aria-current={currentPath.startsWith(item.href) ? 'page' : undefined}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {children}
      </div>
    </header>
  );
}
