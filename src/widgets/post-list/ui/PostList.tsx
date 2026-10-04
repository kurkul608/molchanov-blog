import { PostCard, type PostSummary } from '@entities/post';
import styles from './post-list.module.css';

export interface PostListProps {
  posts: readonly PostSummary[];
  emptyText?: string;
}

export function PostList({ posts, emptyText = 'No posts yet. The first one is on its way.' }: PostListProps) {
  if (posts.length === 0) return <p className={styles.empty}>{emptyText}</p>;
  return (
    <ul className={styles.list}>
      {posts.map((post) => (
        <li key={post.slug}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
