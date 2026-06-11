import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCategoryLabel } from "../data/mockData";
import { translate } from "../i18n/i18n";
import { ideasApi } from "../services/api";
import {
  getCachedIdeaTranslation,
  setCachedIdeaTranslation,
} from "../services/ideaTranslationCache";
import { preloadIdeasFeedTranslations } from "../services/translationPreloader";
import { parseAiRefinementsFromDescription } from "../utils/parseAiRefinements";
import { normalizeLocale, textMatchesLocale } from "../utils/textLocale";

function categoryLabelFor(categoryId, lang) {
  if (!categoryId) return getCategoryLabel(categoryId);
  const key = `categories.${categoryId}`;
  const label = translate(lang, key);
  return label !== key ? label : getCategoryLabel(categoryId);
}

function descriptionBodyForIdea(idea) {
  const { body } = parseAiRefinementsFromDescription(idea?.description ?? "");
  return body || idea?.description || "";
}

function buildDisplayEntry(idea, lang, fields = {}) {
  const title = fields.title ?? idea.title ?? "";
  const description = fields.description ?? descriptionBodyForIdea(idea);
  return {
    title,
    description,
    categoryLabel: fields.categoryLabel ?? categoryLabelFor(idea.categoryId, lang),
    translated: Boolean(fields.translated),
  };
}

function ideasContentKey(ideas) {
  return (ideas || [])
    .map((idea) => {
      const body = descriptionBodyForIdea(idea);
      return `${idea.id}:${idea.title}:${body}:${idea.categoryId}`;
    })
    .join("|");
}

function ideaMatchesLocale(idea, lang) {
  const title = String(idea?.title || "").trim();
  const description = descriptionBodyForIdea(idea).trim();
  const titleOk = !title || textMatchesLocale(title, lang);
  const descriptionOk = !description || textMatchesLocale(description, lang);
  return titleOk && descriptionOk;
}

function buildOriginalDisplay(idea, lang) {
  const body = descriptionBodyForIdea(idea);
  return buildDisplayEntry(idea, lang, {
    title: idea.title || "",
    description: body,
    translated: false,
  });
}

export function useIdeaTranslations(ideas, language, options = {}) {
  const { preloadOpposite = true } = options;
  const lang = normalizeLocale(language);
  const ideaList = ideas || [];
  const ideasRef = useRef(ideaList);
  ideasRef.current = ideaList;
  const contentKey = useMemo(() => ideasContentKey(ideaList), [ideaList]);
  const requestSeq = useRef(0);

  const [displayMap, setDisplayMap] = useState(() => {
    const map = {};
    for (const idea of ideaList) {
      if (!idea?.id) continue;
      const id = String(idea.id);
      const title = idea.title || "";
      const body = descriptionBodyForIdea(idea);
      const cached = getCachedIdeaTranslation(id, lang, title, body);
      map[id] = cached
        ? buildDisplayEntry(idea, lang, cached)
        : buildOriginalDisplay(idea, lang);
    }
    return map;
  });
  const [loadingIds, setLoadingIds] = useState(() => new Set());

  useEffect(() => {
    const list = ideasRef.current;
    if (!list.length) {
      setDisplayMap({});
      setLoadingIds(new Set());
      return undefined;
    }

    const resolved = {};
    const missing = [];

    for (const idea of list) {
      const id = String(idea.id);
      const title = idea.title || "";
      const body = descriptionBodyForIdea(idea);
      const cached = getCachedIdeaTranslation(id, lang, title, body);
      if (cached?.title && cached?.description) {
        resolved[id] = buildDisplayEntry(idea, lang, cached);
        continue;
      }

      resolved[id] = buildOriginalDisplay(idea, lang);

      if (ideaMatchesLocale(idea, lang)) {
        setCachedIdeaTranslation(id, lang, { title, description: body, translated: false }, title, body);
        continue;
      }

      missing.push({ id, title, description: body });
    }

    setDisplayMap(resolved);

    if (preloadOpposite) {
      preloadIdeasFeedTranslations(list, lang);
    }

    if (missing.length === 0) {
      setLoadingIds(new Set());
      return undefined;
    }

    const seq = ++requestSeq.current;
    const pendingIds = new Set(missing.map((item) => String(item.id)));
    setLoadingIds(pendingIds);

    ideasApi
      .translateBatch({ targetLang: lang, items: missing })
      .then((result) => {
        if (seq !== requestSeq.current) return;

        for (const item of result?.items || []) {
          if (!item?.id) continue;
          const source = missing.find((entry) => String(entry.id) === String(item.id));
          if (!source) continue;
          setCachedIdeaTranslation(
            item.id,
            lang,
            item,
            source.title,
            source.description
          );
        }

        setDisplayMap((prev) => {
          const next = { ...prev };
          for (const idea of list) {
            const id = String(idea.id);
            const title = idea.title || "";
            const body = descriptionBodyForIdea(idea);
            const cached = getCachedIdeaTranslation(id, lang, title, body);
            next[id] = cached
              ? buildDisplayEntry(idea, lang, cached)
              : prev[id] || buildOriginalDisplay(idea, lang);
          }
          return next;
        });
      })
      .catch(() => {
        if (seq !== requestSeq.current) return;
        const fallback = {};
        for (const idea of list) {
          if (!idea?.id) continue;
          fallback[String(idea.id)] = buildOriginalDisplay(idea, lang);
        }
        setDisplayMap(fallback);
      })
      .finally(() => {
        if (seq === requestSeq.current) {
          setLoadingIds(new Set());
        }
      });

    return undefined;
  }, [contentKey, lang, preloadOpposite]);

  const getDisplay = useCallback(
    (idea) => {
      if (!idea?.id) {
        return { title: "", description: "", categoryLabel: "", translated: false };
      }

      const id = String(idea.id);
      const title = String(idea.title || "").trim();
      const body = descriptionBodyForIdea(idea).trim();
      const cached = getCachedIdeaTranslation(id, lang, title, body);
      if (cached?.title && cached?.description) {
        return buildDisplayEntry(idea, lang, cached);
      }

      const titleOk = !title || textMatchesLocale(title, lang);
      const bodyOk = !body || textMatchesLocale(body, lang);
      if (titleOk && bodyOk) {
        return buildDisplayEntry(idea, lang, {
          title,
          description: body,
          translated: false,
        });
      }

      const mapped = displayMap[id];
      if (
        mapped &&
        textMatchesLocale(mapped.title, lang) &&
        textMatchesLocale(mapped.description, lang)
      ) {
        return mapped;
      }

      return buildOriginalDisplay(idea, lang);
    },
    [displayMap, lang]
  );

  const isLoading = useCallback(
    (ideaId) => loadingIds.has(String(ideaId)),
    [loadingIds]
  );

  const loading = loadingIds.size > 0;

  return { getDisplay, loading, isLoading, loadingIds };
}
