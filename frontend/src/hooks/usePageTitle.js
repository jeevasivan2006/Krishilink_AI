import { useEffect } from 'react';
import { APP_NAME } from '@/constants';

/**
 * Sets the browser tab title.
 * @param {string} title - Page-specific part of the title
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
    return () => {
      document.title = APP_NAME;
    };
  }, [title]);
}
