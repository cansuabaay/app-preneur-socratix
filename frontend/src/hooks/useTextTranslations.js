import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCachedTextTranslation,
  setCachedTextTranslation,
} from "../services/textTranslationCache";
import {
  queueTranslationsPrioritized,
  resolveTranslationText,
} from "../services/translationCoordinator";
import { normalizeLocale, textMatchesLocale } from "../utils/textLocale";

function buildFallbackMap(items) {
  const map = {};
  for (const item of items || []) {
    if (!item?.id) continue;
    map[String(item.id)] = String(item.text || "");
  }
  return map;
}

function itemsContentKey(items) {
  return (items || [])
    .map((item) => `${item.id}:${item.text}`)
    .join("|");
}

function itemBundleId(item, defaultBundleId) {
  return String(item.bundleId || defaultBundleId || "default");
}

function buildResolvedMap(items, defaultBundleId, lang) {
  const resolved = buildFallbackMap(items);
  for (const item of items || []) {
    const id = String(item.id);
    const bundleId = itemBundleId(item, defaultBundleId);
    const source = String(item.text || "").trim();
    if (!source) continue;

    const cached = getCachedTextTranslation(bundleId, id, lang, source);
    if (cached) {
      resolved[id] = cached;
      continue;
    }

    if (textMatchesLocale(source, lang)) {
      resolved[id] = source;
      setCachedTextTranslation(bundleId, id, lang, source, source);
    }
  }
  return resolved;
}

function idsNeedingTranslation(items, defaultBundleId, lang) {
  const ids = [];
  for (const item of items || []) {
    const id = String(item.id);
    const bundleId = itemBundleId(item, defaultBundleId);
    const source = String(item.text || "").trim();
    if (!source) continue;
    if (getCachedTextTranslation(bundleId, id, lang, source)) continue;
    if (textMatchesLocale(source, lang)) continue;
    ids.push(id);
  }
  return ids;
}

export function useTextTranslations(items, language, bundleId = "default", options = {}) {
  const { priorityGroups = null } = options;
  const lang = normalizeLocale(language);
  const itemList = items || [];
  const contentKey = useMemo(() => itemsContentKey(itemList), [itemList]);
  const requestSeq = useRef(0);

  const [textMap, setTextMap] = useState(() =>
    buildResolvedMap(itemList, bundleId, lang)
  );
  const [loadingIds, setLoadingIds] = useState(() => new Set());

  const itemBundleMap = useMemo(() => {
    const map = {};
    for (const item of itemList) {
      map[String(item.id)] = itemBundleId(item, bundleId);
    }
    return map;
  }, [itemList, bundleId]);

  const applyPartialResults = useCallback(
    (translatedById, pendingIds) => {
      setTextMap((prev) => {
        const next = { ...prev };
        for (const item of itemList) {
          const id = String(item.id);
          if (!(id in translatedById)) continue;
          const source = String(item.text || "").trim();
          const itemBundle = itemBundleMap[id] || bundleId;
          next[id] = resolveTranslationText(
            itemBundle,
            id,
            source,
            lang,
            translatedById[id] ?? prev[id]
          );
        }
        return next;
      });

      setLoadingIds((prev) => {
        const next = new Set(prev);
        for (const id of pendingIds) {
          if (id in translatedById) next.delete(id);
        }
        return next;
      });
    },
    [bundleId, itemBundleMap, itemList, lang]
  );

  useEffect(() => {
    if (!itemList.length) {
      setTextMap({});
      setLoadingIds(new Set());
      return undefined;
    }

    const resolved = buildResolvedMap(itemList, bundleId, lang);
    setTextMap(resolved);

    const missing = [];
    for (const item of itemList) {
      const id = String(item.id);
      const itemBundle = itemBundleId(item, bundleId);
      const source = String(item.text || "").trim();
      if (!source) continue;
      if (getCachedTextTranslation(itemBundle, id, lang, source)) continue;
      if (textMatchesLocale(source, lang)) continue;
      missing.push({ bundleId: itemBundle, contentId: id, text: source });
    }

    if (missing.length === 0) {
      setLoadingIds(new Set());
      return undefined;
    }

    const seq = ++requestSeq.current;
    const pendingIds = new Set(missing.map((item) => item.contentId));
    setLoadingIds(pendingIds);

    const groups =
      priorityGroups?.length > 0
        ? priorityGroups
        : [missing.map((item) => item.contentId)];

    queueTranslationsPrioritized(missing, lang, {
      priorityGroups: groups,
      onPartial: (partial) => {
        if (seq !== requestSeq.current) return;
        applyPartialResults(partial, pendingIds);
      },
    })
      .then((translatedById) => {
        if (seq !== requestSeq.current) return;
        applyPartialResults(translatedById, pendingIds);
      })
      .catch(() => {
        if (seq !== requestSeq.current) return;
        setTextMap(buildResolvedMap(itemList, bundleId, lang));
      })
      .finally(() => {
        if (seq === requestSeq.current) {
          setLoadingIds(new Set());
        }
      });

    return undefined;
  }, [applyPartialResults, bundleId, contentKey, lang, priorityGroups]);

  const getText = useCallback(
    (id, fallback = "") => {
      const key = String(id);
      const source = String(fallback ?? "").trim();
      const itemBundle = itemBundleMap[key] || bundleId;
      return resolveTranslationText(itemBundle, key, source, lang, textMap[key]);
    },
    [textMap, bundleId, itemBundleMap, lang]
  );

  const isLoading = useCallback(
    (id) => loadingIds.has(String(id)),
    [loadingIds]
  );

  const loading = loadingIds.size > 0;

  return { getText, textMap, loading, isLoading, loadingIds };
}

export function buildPriorityGroupsFromIds(orderedIds, allIds) {
  const seen = new Set();
  const groups = [];

  for (const id of orderedIds || []) {
    const key = String(id);
    if (!allIds.includes(key) || seen.has(key)) continue;
    groups.push([key]);
    seen.add(key);
  }

  const remainder = allIds.filter((id) => !seen.has(id));
  if (remainder.length > 0) {
    groups.push(remainder);
  }

  return groups;
}

export { idsNeedingTranslation };
