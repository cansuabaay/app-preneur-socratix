import { useCallback } from "react";
import { useSocratixStore } from "../data/SocratixStoreProvider";
import { translate } from "./i18n";

export function useTranslation() {
  const { language, setLanguage } = useSocratixStore();

  const t = useCallback(
    (key, vars) => translate(language, key, vars),
    [language]
  );

  return { t, language, setLanguage };
}
