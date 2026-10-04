import { AUTHOR } from '../model/author';
import styles from './social-links.module.css';

export function SocialLinks({ label = 'Profiles' }: { label?: string }) {
  return (
    <ul className={styles.list} aria-label={label}>
      {AUTHOR.links.map((link) => (
        <li key={link.href}>
          <a href={link.href} rel="me noopener" target="_blank">
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
