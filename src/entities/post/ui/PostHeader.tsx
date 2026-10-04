import type { PostSummary } from '../model/types';
import { PostMeta } from './PostMeta';
import styles from './post.module.css';

export function PostHeader({ post }: { post: PostSummary }) {
  return (
    <header className={styles.header}>
      <h1>{post.title}</h1>
      <PostMeta post={post} />
      {post.tags.length > 0 ? (
        <ul className={styles.tags} aria-label="Tags">
          {post.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
