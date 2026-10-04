import { SITE_NAME } from '@shared/config';

/** `Post title | Petr Molchanov`. */
export function pageTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}
