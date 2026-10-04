export const CALLOUT_TYPES = ['note', 'tip', 'warning'] as const;
export type CalloutType = (typeof CALLOUT_TYPES)[number];

export const CALLOUT_LABELS: Readonly<Record<CalloutType, string>> = {
  note: 'Note',
  tip: 'Tip',
  warning: 'Warning',
};

export function isCalloutType(value: unknown): value is CalloutType {
  return typeof value === 'string' && (CALLOUT_TYPES as readonly string[]).includes(value);
}
