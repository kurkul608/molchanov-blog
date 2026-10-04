export interface SocialLink {
  label: string;
  href: string;
}

/** Public facts about the author. Add only facts the author has confirmed. */
export const AUTHOR = {
  name: 'Petr Molchanov',
  tagline: 'Frontend engineer moving into AI engineering',
  location: 'Buenos Aires',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/petr-molchanov-b9b649202' },
    { label: 'GitHub', href: 'https://github.com/kurkul608' },
  ] satisfies SocialLink[],
} as const;
