import type { RootContent } from 'mdast';

/** Props of a JSX element in MDX. Boolean attributes (`<X open />`) are `true`. */
export type JsxProps = Readonly<Record<string, string | true>>;

export interface FallbackInput {
  /** Component name, for example `Callout`. */
  name: string;
  props: JsxProps;
  /** Children, already lowered to plain Markdown nodes. */
  children: RootContent[];
  /** `true` when the element is used inside a paragraph (`mdxJsxTextElement`). */
  inline: boolean;
}

/** Renders one MDX component as plain Markdown (mdast) nodes. */
export type MarkdownFallback = (input: FallbackInput) => RootContent[];

export type FallbackRegistry = Readonly<Record<string, MarkdownFallback>>;

export function getFallback(registry: FallbackRegistry, name: string): MarkdownFallback | undefined {
  return Object.hasOwn(registry, name) ? registry[name] : undefined;
}
