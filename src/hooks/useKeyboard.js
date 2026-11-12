import { useEffect } from 'react';
import { useClickOutside } from './useClickOutside';

export const useKeyDown = (key, handler, active = true) => {
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event) => {
      if (event.key === key || (Array.isArray(key) && key.includes(event.key))) {
        handler(event);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [key, handler, active]);
};

export { useClickOutside };
