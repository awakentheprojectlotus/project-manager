let lockCount = 0;
let previousOverflow = '';
let previousPaddingRight = '';

export const lockBodyScroll = () => {
  if (typeof document === 'undefined') return () => {};

  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  lockCount += 1;
  let released = false;

  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      previousOverflow = '';
      previousPaddingRight = '';
    }
  };
};

export const getScrollLockCount = () => lockCount;

export const resetBodyScrollLock = () => {
  if (typeof document === 'undefined') return;
  lockCount = 0;
  document.body.style.overflow = previousOverflow || '';
  document.body.style.paddingRight = previousPaddingRight || '';
  previousOverflow = '';
  previousPaddingRight = '';
};
