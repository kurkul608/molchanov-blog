export interface SocialLink {
  label: string;
  href: string;
}

/** Public facts about the author. Add only facts the author has confirmed. */
export const AUTHOR = {
  name: 'Petr Molchanov',
  jobTitle: 'Applied AI Engineer',
  tagline: 'Applied AI engineer with a fullstack background',
  pitch:
    'I design multi-agent LLM systems in TypeScript: an orchestrator plans and verifies, cheaper subagents research in parallel. 8+ years of shipping web products with React and Node.js.',
  location: 'Buenos Aires, Argentina',
  email: 'petr.molchanov98@gmail.com',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/petr-molchanov' },
    { label: 'GitHub', href: 'https://github.com/kurkul608' },
    { label: 'Telegram', href: 'https://t.me/kurkul608' },
    { label: 'Email', href: 'mailto:petr.molchanov98@gmail.com' },
  ] satisfies SocialLink[],
} as const;
