export interface SocialLink {
  label: string;
  href: string;
}

/** Public facts about the author. Add only facts the author has confirmed. */
export const AUTHOR = {
  name: 'Petr Molchanov',
  tagline: 'Frontend engineer moving into AI engineering',
  location: 'Buenos Aires',
  email: 'petr.molchanov98@gmail.com',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/petr-molchanov' },
    { label: 'GitHub', href: 'https://github.com/kurkul608' },
    { label: 'Telegram', href: 'https://t.me/kurkul608' },
    { label: 'Email', href: 'mailto:petr.molchanov98@gmail.com' },
  ] satisfies SocialLink[],
} as const;
