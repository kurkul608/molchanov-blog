import { getCollection, getEntry } from 'astro:content';
import type { StaticPage } from './types';

export async function getStaticPages(): Promise<StaticPage[]> {
  return getCollection('pages');
}

export async function getStaticPage(id: string): Promise<StaticPage | undefined> {
  return getEntry('pages', id);
}
