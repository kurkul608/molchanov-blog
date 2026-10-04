import { formatDisplayDate, toIsoDate } from '@shared/lib';
import { PILLAR_LABELS } from '../config/pillars';
import type { PostSummary } from '../model/types';
import styles from './post.module.css';

export function PostMeta({ post }: { post: PostSummary }) {
  return (
    <p className={styles.meta}>
      <time dateTime={toIsoDate(post.published)}>{formatDisplayDate(post.published)}</time>
      {post.updated && post.updated.getTime() !== post.published.getTime() ? (
        <>
          {' '}
          (updated <time dateTime={toIsoDate(post.updated)}>{formatDisplayDate(post.updated)}</time>)
        </>
      ) : null}
      <span aria-hidden="true"> · </span>
      <span>{PILLAR_LABELS[post.pillar]}</span>
    </p>
  );
}
