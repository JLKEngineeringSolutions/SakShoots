import { createContext, useContext } from 'react';
import type { SiteData } from '@/lib/content';

const SiteDataContext = createContext<SiteData | null>(null);

export const SiteDataProvider = SiteDataContext.Provider;

export function useSiteData(): SiteData {
  const data = useContext(SiteDataContext);
  if (!data) throw new Error('useSiteData must be used inside SiteDataProvider');
  return data;
}
