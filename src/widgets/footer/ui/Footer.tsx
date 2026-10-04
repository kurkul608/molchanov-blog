import { AUTHOR, SocialLinks } from '@entities/author';
import styles from './footer.module.css';

export function Footer({ year }: { year: number }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.copy}>
          © {year} {AUTHOR.name}
        </p>
        <SocialLinks label="Author profiles" />
        <ul className={styles.feeds} aria-label="Feeds">
          <li>
            <a href="/rss.xml">RSS</a>
          </li>
          <li>
            <a href="/llms.txt">llms.txt</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
