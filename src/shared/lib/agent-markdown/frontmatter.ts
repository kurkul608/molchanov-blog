import { toIsoDate } from '../date';

export type FrontmatterValue = string | Date | readonly string[] | undefined;
export type Frontmatter = Readonly<Record<string, FrontmatterValue>>;

const PLAIN_SCALAR = /^[A-Za-z0-9][A-Za-z0-9 ._/:-]*$/;
const RESERVED = /^(true|false|yes|no|on|off|null|~|[0-9.+-]+)$/i;

function scalar(value: string): string {
  const plain = PLAIN_SCALAR.test(value) && !RESERVED.test(value) && !value.includes(': ') && !value.endsWith(':');
  return plain ? value : JSON.stringify(value);
}

/** Serializes a flat record to YAML. `undefined` values are skipped. Dates become `YYYY-MM-DD`. */
export function serializeFrontmatter(data: Frontmatter): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value instanceof Date) {
      lines.push(`${key}: ${toIsoDate(value)}`);
    } else if (typeof value === 'string') {
      lines.push(`${key}: ${scalar(value)}`);
    } else {
      lines.push(`${key}: [${value.map(scalar).join(', ')}]`);
    }
  }
  return lines.join('\n');
}
