import type { BlockContent, PhrasingContent, RootContent } from 'mdast';
import type { MarkdownFallback } from '@shared/lib/agent-markdown';
import { CALLOUT_LABELS, isCalloutType } from './config';

/** `<Callout type="note">text</Callout>` becomes `> **Note:** text`. */
export const calloutMarkdown: MarkdownFallback = ({ props, children, inline }) => {
  const kind = isCalloutType(props['type']) ? props['type'] : 'note';
  const title = props['title'];
  const label = typeof title === 'string' ? title : CALLOUT_LABELS[kind];
  const lead: PhrasingContent[] = [
    { type: 'strong', children: [{ type: 'text', value: `${label}:` }] },
    { type: 'text', value: ' ' },
  ];

  if (inline) return [...lead, ...(children as PhrasingContent[])] as RootContent[];

  const [first, ...rest] = children;
  const body: RootContent[] =
    first?.type === 'paragraph'
      ? [{ ...first, children: [...lead, ...first.children] }, ...rest]
      : [{ type: 'paragraph', children: lead.slice(0, 1) }, ...children];

  return [{ type: 'blockquote', children: body as BlockContent[] }];
};
