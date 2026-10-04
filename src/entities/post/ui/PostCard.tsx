import type { PostSummary } from '../model/types';
import { PostMeta } from './PostMeta';
import styles from './post.module.css';

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className={styles.card}>
      <h3 className={styles.cardTitle}>
        <a href={post.href}>{post.title}</a>
      </h3>
      <PostMeta post={post} />
      <p className={styles.description}>{post.description}</p>
    </article>
  );
}
