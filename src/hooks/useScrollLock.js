import { useEffect } from 'react';
import { lockBodyScroll } from '../utils/scrollLock';

export const useScrollLock = (active = true) => {
  useEffect(() => {
    if (!active) return undefined;
    return lockBodyScroll();
  }, [active]);
};
