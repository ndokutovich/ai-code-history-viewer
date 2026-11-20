import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A "copied" flag that resets itself after `delayMs`.
 *
 * The reset used to be a bare setTimeout, which fired setState on a component
 * that may already be unmounted (row collapsed, session switched, test
 * teardown). The timer is now owned by the hook and cleared on unmount
 * (upstream #791).
 */
export function useCopiedFlag(delayMs = 2000): [boolean, () => void] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (timer.current !== undefined) clearTimeout(timer.current);
    },
    []
  );

  const markCopied = useCallback(() => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), delayMs);
  }, [delayMs]);

  return [copied, markCopied];
}
