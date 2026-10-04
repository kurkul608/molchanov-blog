import { AUTHOR, SocialLinks } from '@entities/author';
import styles from './author-card.module.css';

export function AuthorCard() {
  return (
    <section className={styles.card} aria-labelledby="author-card-title">
      <h1 id="author-card-title" className={styles.name}>
        {AUTHOR.name}
      </h1>
      <p className={styles.tagline}>
        {AUTHOR.tagline}. Based in {AUTHOR.location}.
      </p>
      <p>Notes on building AI tools in TypeScript, frontend performance, and the move from frontend to AI engineering.</p>
      <SocialLinks />
    </section>
  );
}
