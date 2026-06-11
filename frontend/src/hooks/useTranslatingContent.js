import { useMemo } from "react";

export function useTranslatingContent(...loadingFlags) {
  return useMemo(
    () => loadingFlags.some(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadingFlags
  );
}
