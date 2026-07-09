import { useEffect } from 'react';

/**
 * Calls `handler` when a click/touch occurs outside of `ref`.
 * @param {React.RefObject} ref
 * @param {Function}        handler
 * @param {boolean}         [enabled=true]
 */
export function useOutsideClick(ref, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, enabled]);
}
