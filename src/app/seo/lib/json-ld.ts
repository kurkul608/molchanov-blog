import { AUTHOR } from '@entities/author';
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_LANG, SITE_NAME, SITE_URL } from '@shared/config';
import { absoluteUrl } from '@shared/lib';

type JsonLdNode = Record<string, unknown>;

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function personSchema(): JsonLdNode {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: AUTHOR.name,
    jobTitle: AUTHOR.tagline,
    url: `${SITE_URL}/`,
    sameAs: AUTHOR.links.map((link) => link.href),
    homeLocation: { '@type': 'Place', name: AUTHOR.location },
  };
}

export function websiteSchema(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANG,
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
  };
}

export interface ArticleInput {
  title: string;
  description: string;
  path: string;
  published: Date;
  updated?: Date | undefined;
  tags: readonly string[];
  image?: string | undefined;
}

export function blogPostingSchema(article: ArticleInput): JsonLdNode {
  const url = absoluteUrl(article.path);
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: article.title,
    description: article.description,
    datePublished: article.published.toISOString(),
    dateModified: (article.updated ?? article.published).toISOString(),
    keywords: article.tags.join(', '),
    inLanguage: SITE_LANG,
    image: absoluteUrl(article.image ?? DEFAULT_OG_IMAGE),
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

export interface Breadcrumb {
  name: string;
  path: string;
}

export function breadcrumbSchema(items: readonly Breadcrumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export interface JsonLdInput {
  article?: ArticleInput | undefined;
  breadcrumbs?: readonly Breadcrumb[] | undefined;
}

/** Site-wide Person + WebSite, plus BlogPosting and BreadcrumbList when given. */
export function buildJsonLd({ article, breadcrumbs }: JsonLdInput = {}): JsonLdNode {
  const graph: JsonLdNode[] = [personSchema(), websiteSchema()];
  if (article) graph.push(blogPostingSchema(article));
  if (breadcrumbs && breadcrumbs.length > 0) graph.push(breadcrumbSchema(breadcrumbs));
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** JSON for a `<script type="application/ld+json">` tag. `<` is escaped so content cannot close the tag. */
export function serializeJsonLd(data: JsonLdNode): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
