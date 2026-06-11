import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { getCategoryLabel } from "./mockData";
import { translate } from "../i18n/i18n";
import {
  authApi,
  ideasApi,
  persistAccessToken,
  resolveAvatarUrl,
  usersApi,
} from "../services/api";
import { normalizeImprovementList } from "../utils/aiImprovements";
import {
  buildReviewAnswers,
  cacheDevilQuestions,
  normalizeApiIdea,
} from "../utils/reviewAnswers";

const StoreContext = createContext(null);

const initialCreateDraft = () => ({
  title: "",
  description: "",
  categoryId: "cat-product",
  aiVisible: false,
  aiSummary: "",
  improvements: [],
  similarWarnings: [],
});

function readStoredLanguage() {
  try {
    if (typeof window === "undefined") return "en";
    return window.localStorage.getItem("socratix_language") === "tr" ? "tr" : "en";
  } catch {
    return "en";
  }
}

const SETTINGS_KEY_PREFIX = "socratix_settings_";

const defaultUserSettings = () => ({
  emailNotifications: true,
  weeklyDigest: true,
  experimentalAi: false,
  ideaVoteAlerts: true,
});

function readUserSettings(userId) {
  const defaults = defaultUserSettings();
  if (!userId) return defaults;
  try {
    const raw = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${userId}`);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

function persistUserSettings(userId, settings) {
  if (!userId) return;
  try {
    localStorage.setItem(`${SETTINGS_KEY_PREFIX}${userId}`, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function normalizeApiUser(user) {
  const name = user?.name || "";
  return {
    ...user,
    id: user?.id != null ? String(user.id) : "",
    avatarInitials: makeInitials(name || "User"),
    avatarUrl: resolveAvatarUrl(user?.avatarUrl),
    bio: user?.bio?.trim() || "",
    jobTitle: user?.jobTitle?.trim() || "",
    innovationRole: user?.innovationRole || "innovation_contributor",
  };
}

const initialState = {
  isAuthenticated: false,
  language: readStoredLanguage(),
  toasts: [],
  currentUser: null,
  userDirectory: {},
  ideas: [],
  createDraft: initialCreateDraft(),
  apiStatus: "idle",
  apiError: "",
  userSettings: defaultUserSettings(),
};

function makeInitials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_API_STATUS":
      return {
        ...state,
        apiStatus: action.payload.status,
        apiError: action.payload.error || "",
      };

    case "SET_IDEAS":
      return {
        ...state,
        ideas: (action.payload || []).map((idea) => normalizeApiIdea(idea)),
      };

    case "UPSERT_IDEA": {
      const idea = normalizeApiIdea(action.payload);
      const ideaKey = String(idea.id);
      const exists = state.ideas.some((i) => String(i.id) === ideaKey);

      return {
        ...state,
        ideas: exists
          ? state.ideas.map((i) => (String(i.id) === ideaKey ? idea : i))
          : [idea, ...state.ideas],
      };
    }

    case "PATCH_IDEA": {
      const { ideaId, patch } = action.payload;
      const ideaKey = String(ideaId);
      const index = state.ideas.findIndex((idea) => String(idea.id) === ideaKey);
      if (index === -1) {
        return {
          ...state,
          ideas: [normalizeApiIdea({ id: ideaKey, ...patch }), ...state.ideas],
        };
      }
      const nextIdeas = [...state.ideas];
      nextIdeas[index] = normalizeApiIdea({ ...nextIdeas[index], ...patch });
      return { ...state, ideas: nextIdeas };
    }

    case "SET_STRATEGIC_ANALYSIS": {
      const { ideaId, strategicAnalysis } = action.payload;
      const ideaKey = String(ideaId);
      const index = state.ideas.findIndex((idea) => String(idea.id) === ideaKey);
      const analysisPayload =
        strategicAnalysis && typeof strategicAnalysis === "object"
          ? { ...strategicAnalysis }
          : null;

      if (index === -1) {
        return {
          ...state,
          ideas: [
            normalizeApiIdea({ id: ideaKey, strategicAnalysis: analysisPayload }),
            ...state.ideas,
          ],
        };
      }

      const nextIdeas = [...state.ideas];
      nextIdeas[index] = normalizeApiIdea({
        ...nextIdeas[index],
        strategicAnalysis: analysisPayload,
      });
      return { ...state, ideas: nextIdeas };
    }

    case "REMOVE_IDEA":
      return {
        ...state,
        ideas: state.ideas.filter(
          (i) => String(i.id) !== String(action.payload.ideaId)
        ),
      };

    case "SET_LANGUAGE":
      return { ...state, language: action.payload === "tr" ? "tr" : "en" };

    case "ADD_TOAST":
      return { ...state, toasts: [...state.toasts, action.payload] };

    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload.id),
      };

    case "LOGIN":
    case "SIGN_UP": {
      const { user } = action.payload;
      const normalized = normalizeApiUser(user);

      return {
        ...state,
        isAuthenticated: true,
        currentUser: normalized,
        userSettings: readUserSettings(normalized.id),
        userDirectory: {
          ...state.userDirectory,
          [normalized.id]: normalized,
        },
      };
    }

    case "UPDATE_USER": {
      const normalized = normalizeApiUser(action.payload.user);
      return {
        ...state,
        currentUser: normalized,
        userDirectory: {
          ...state.userDirectory,
          [normalized.id]: normalized,
        },
      };
    }

    case "SET_USER_DIRECTORY":
      return {
        ...state,
        userDirectory: action.payload,
      };

    case "LOG_OUT":
      return {
        ...initialState,
        language: readStoredLanguage(),
        ideas: [],
        userDirectory: {},
        userSettings: defaultUserSettings(),
      };

    case "UPDATE_SETTINGS": {
      const next = { ...state.userSettings, ...action.payload };
      persistUserSettings(state.currentUser?.id, next);
      return {
        ...state,
        userSettings: next,
      };
    }

    case "UPDATE_CREATE_DRAFT":
      return {
        ...state,
        createDraft: { ...state.createDraft, ...action.payload },
      };

    case "RESET_CREATE_DRAFT":
      return { ...state, createDraft: initialCreateDraft() };

    case "SET_AI_IMPROVE": {
      const { improvements, similarWarnings, summary } = action.payload;
      const stamp = Date.now();

      return {
        ...state,
        createDraft: {
          ...state.createDraft,
          aiVisible: true,
          aiSummary: summary || "",
          improvements: normalizeImprovementList(improvements).map((item, index) => ({
            ...item,
            id: `ai-${stamp}-${index}`,
            status: "pending",
          })),
          similarWarnings: (similarWarnings || []).map((warning, index) => ({
            id: `sim-${stamp}-${index}`,
            title: warning.title || "",
            detail: warning.detail || "",
            dismissed: false,
            acknowledged: false,
          })),
        },
      };
    }

    case "ACCEPT_SUGGESTION": {
      const { suggestionId } = action.payload;
      const improvements = state.createDraft.improvements.map((s) =>
        s.id === suggestionId ? { ...s, status: "accepted" } : s
      );

      const suggestion = improvements.find((s) => s.id === suggestionId);
      let description = state.createDraft.description;

      if (suggestion?.text) {
        description =
          description.trimEnd() + `\n\n[AI refinement] ${suggestion.text}`;
      }

      return {
        ...state,
        createDraft: { ...state.createDraft, improvements, description },
      };
    }

    case "DISMISS_SUGGESTION": {
      const { suggestionId } = action.payload;

      return {
        ...state,
        createDraft: {
          ...state.createDraft,
          improvements: state.createDraft.improvements.map((s) =>
            s.id === suggestionId ? { ...s, status: "dismissed" } : s
          ),
        },
      };
    }

    case "ACK_SIMILAR_WARNING": {
      const { warningId } = action.payload;

      return {
        ...state,
        createDraft: {
          ...state.createDraft,
          similarWarnings: state.createDraft.similarWarnings.map((w) =>
            w.id === warningId ? { ...w, acknowledged: true } : w
          ),
        },
      };
    }

    case "DISMISS_SIMILAR_WARNING": {
      const { warningId } = action.payload;

      return {
        ...state,
        createDraft: {
          ...state.createDraft,
          similarWarnings: state.createDraft.similarWarnings.map((w) =>
            w.id === warningId ? { ...w, dismissed: true } : w
          ),
        },
      };
    }

    case "CREATE_IDEA_FROM_DRAFT": {
      const newIdea = normalizeApiIdea(action.payload.idea);

      return {
        ...state,
        ideas: [
          newIdea,
          ...state.ideas.filter((idea) => idea.id !== newIdea.id),
        ],
        createDraft: initialCreateDraft(),
      };
    }

    case "SET_DEVIL_QUESTIONS": {
      const { ideaId, questions } = action.payload;
      cacheDevilQuestions(ideaId, questions);
      return {
        ...state,
        ideas: state.ideas.map((idea) =>
          String(idea.id) === String(ideaId)
            ? { ...idea, devilQuestions: questions }
            : idea
        ),
      };
    }

    case "SUBMIT_DEVIL": {
      const { ideaId, answers, skipped, questions, reviewAnswers } = action.payload;
      const pairs = reviewAnswers?.length
        ? reviewAnswers
        : buildReviewAnswers(questions, answers);
      return {
        ...state,
        ideas: state.ideas.map((idea) =>
          String(idea.id) === String(ideaId)
            ? {
                ...idea,
                devilAnswers: pairs,
                devilQuestions: pairs.map((pair) => pair.question),
                devilSkipped: skipped,
                progressStatus: "submitted",
                aiReviewed: !skipped,
              }
            : idea
        ),
      };
    }

    case "ADD_COMMENT": {
      const { ideaId, body } = action.payload;
      if (!state.currentUser) return state;

      const comment = {
        id: `c-${Date.now()}`,
        authorId: state.currentUser.id,
        authorName: state.currentUser.name,
        body: body.trim(),
        createdAt: new Date().toISOString(),
      };

      return {
        ...state,
        ideas: state.ideas.map((idea) =>
          idea.id === ideaId
            ? { ...idea, comments: [...(idea.comments || []), comment] }
            : idea
        ),
      };
    }

    case "APPLY_VOTE": {
      const { ideaId, votes, voters, voted } = action.payload;
      const ideaKey = String(ideaId);

      return {
        ...state,
        ideas: state.ideas.map((idea) =>
          String(idea.id) === ideaKey ? { ...idea, votes, voters } : idea
        ),
        toasts: voted
          ? [...state.toasts, { id: `toast-${Date.now()}`, key: "voteCounted" }]
          : state.toasts,
      };
    }

    default:
      return state;
  }
}

export function SocratixStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("socratix_token");
    if (!token) return undefined;

    authApi
      .me()
      .then((user) => {
        if (!active) return;
        dispatch({
          type: "LOGIN",
          payload: { user },
        });
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem("socratix_token");
      });

    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback((language) => {
    const lang = language === "tr" ? "tr" : "en";
    try {
      localStorage.setItem("socratix_language", lang);
    } catch {
      /* ignore */
    }
    dispatch({ type: "SET_LANGUAGE", payload: lang });
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: "REMOVE_TOAST", payload: { id } });
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    persistAccessToken(data);
    dispatch({
      type: "LOGIN",
      payload: { user: data.user },
    });
  }, []);

  const signUp = useCallback(async (payload) => {
    const { name, email, password, departmentId, jobTitle } = payload;
    const data = await authApi.register({
      name,
      email,
      password,
      departmentId,
      jobTitle: jobTitle || undefined,
    });
    persistAccessToken(data);
    dispatch({
      type: "SIGN_UP",
      payload: { user: data.user },
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("socratix_token");
    dispatch({ type: "LOG_OUT" });
  }, []);

  const updateSettings = useCallback((payload) => {
    dispatch({ type: "UPDATE_SETTINGS", payload });
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const user = await authApi.updateMe(payload);
    dispatch({ type: "UPDATE_USER", payload: { user } });
    dispatch({
      type: "ADD_TOAST",
      payload: { id: `toast-${Date.now()}`, key: "profile.updatedSuccess" },
    });
    return user;
  }, []);

  const loadUserDirectory = useCallback(async () => {
    try {
      const users = await usersApi.list();
      const directory = {};
      for (const user of users || []) {
        const normalized = normalizeApiUser(user);
        if (normalized.id) {
          directory[normalized.id] = normalized;
        }
      }
      dispatch({ type: "SET_USER_DIRECTORY", payload: directory });
    } catch {
      /* directory is optional; avatars fall back to initials */
    }
  }, []);

  const uploadAvatar = useCallback(async (file) => {
    const user = await authApi.uploadAvatar(file);
    dispatch({ type: "UPDATE_USER", payload: { user } });
    await loadUserDirectory();
    return user;
  }, [loadUserDirectory]);

  const removeAvatar = useCallback(async () => {
    const user = await authApi.removeAvatar();
    dispatch({ type: "UPDATE_USER", payload: { user } });
    await loadUserDirectory();
    return user;
  }, [loadUserDirectory]);

  const updateCreateDraft = useCallback((payload) => {
    dispatch({ type: "UPDATE_CREATE_DRAFT", payload });
  }, []);

  const resetCreateDraft = useCallback(() => {
    dispatch({ type: "RESET_CREATE_DRAFT" });
  }, []);

  const runAiImprove = useCallback(async () => {
    const { title, description, categoryId } = state.createDraft;
    const result = await ideasApi.aiImprove({
      title: title.trim(),
      description: description.trim(),
      categoryId,
      targetLanguage: state.language === "tr" ? "tr" : "en",
    });
    dispatch({ type: "SET_AI_IMPROVE", payload: result });
  }, [state.createDraft, state.language]);

  const acceptSuggestion = useCallback((suggestionId) => {
    dispatch({ type: "ACCEPT_SUGGESTION", payload: { suggestionId } });
  }, []);

  const dismissSuggestion = useCallback((suggestionId) => {
    dispatch({ type: "DISMISS_SUGGESTION", payload: { suggestionId } });
  }, []);

  const acknowledgeSimilar = useCallback((warningId) => {
    dispatch({ type: "ACK_SIMILAR_WARNING", payload: { warningId } });
  }, []);

  const dismissSimilar = useCallback((warningId) => {
    dispatch({ type: "DISMISS_SIMILAR_WARNING", payload: { warningId } });
  }, []);

  const lookupUser = useCallback(
    (userId) => {
      if (userId == null) return null;
      const key = String(userId);
      if (state.userDirectory[key]) {
        return state.userDirectory[key];
      }
      if (state.currentUser && String(state.currentUser.id) === key) {
        return state.currentUser;
      }
      return null;
    },
    [state.userDirectory, state.currentUser]
  );

  const loadIdeas = useCallback(async () => {
    dispatch({ type: "SET_API_STATUS", payload: { status: "loading" } });

    try {
      const ideas = await ideasApi.list();
      dispatch({ type: "SET_IDEAS", payload: ideas });
      dispatch({ type: "SET_API_STATUS", payload: { status: "ready" } });
    } catch (error) {
      dispatch({
        type: "SET_API_STATUS",
        payload: { status: "fallback", error: error.message },
      });
    }
  }, []);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    loadIdeas();
    loadUserDirectory();
  }, [state.isAuthenticated, loadIdeas, loadUserDirectory]);

  const createIdeaFromDraft = useCallback(async () => {
    if (!state.currentUser) return null;

    const draft = state.createDraft;

    const fallbackIdea = {
      id: `idea-${Date.now()}`,
      title: draft.title.trim(),
      description: draft.description.trim(),
      categoryId: draft.categoryId,
      departmentId: state.currentUser.departmentId,
      authorId: state.currentUser.id,
      authorName: state.currentUser.name,
      votes: 0,
      progressStatus: "draft",
      aiReviewed: false,
      createdAt: new Date().toISOString(),
      comments: [],
      devilQuestions: [],
      devilAnswers: [],
      devilSkipped: false,
      voters: [],
    };

    try {
      const savedIdea = await ideasApi.create(fallbackIdea);
      dispatch({
        type: "CREATE_IDEA_FROM_DRAFT",
        payload: { idea: savedIdea },
      });

      return String(savedIdea.id);
    } catch (error) {
      dispatch({
        type: "CREATE_IDEA_FROM_DRAFT",
        payload: { idea: fallbackIdea },
      });
      dispatch({
        type: "SET_API_STATUS",
        payload: { status: "fallback", error: error.message },
      });

      return String(fallbackIdea.id);
    }
  }, [state.currentUser, state.createDraft]);

  const generateDevilQuestions = useCallback(async (ideaId, targetLanguage = "en") => {
    const data = await ideasApi.generateDevilQuestions(ideaId, targetLanguage);
    const questions = data.questions || [];
    cacheDevilQuestions(ideaId, questions);
    dispatch({
      type: "SET_DEVIL_QUESTIONS",
      payload: { ideaId, questions },
    });
    return questions;
  }, []);

  const updateIdea = useCallback(async (ideaId, payload) => {
    const updatedIdea = await ideasApi.update(ideaId, payload);
    dispatch({ type: "UPSERT_IDEA", payload: updatedIdea });
    return updatedIdea;
  }, []);

  const deleteIdea = useCallback(async (ideaId) => {
    await ideasApi.remove(ideaId);
    dispatch({ type: "REMOVE_IDEA", payload: { ideaId } });
  }, []);

  const submitDevil = useCallback(
    async (payload) => {
      const currentIdea = state.ideas.find(
        (idea) => String(idea.id) === String(payload.ideaId)
      );

      const questions =
        payload.questions?.length > 0
          ? payload.questions
          : currentIdea?.devilQuestions?.length > 0
            ? currentIdea.devilQuestions
            : [];

      const reviewAnswers = payload.reviewAnswers?.length
        ? payload.reviewAnswers
        : buildReviewAnswers(questions, payload.answers);

      const submitPayload = {
        ideaId: payload.ideaId,
        answers: payload.answers,
        skipped: payload.skipped,
        questions,
        reviewAnswers,
      };

      dispatch({ type: "SUBMIT_DEVIL", payload: submitPayload });

      try {
        const apiBody = {
          answers: payload.answers,
          skipped: payload.skipped,
        };
        if (questions.length > 0) {
          apiBody.questions = questions;
        }
        if (reviewAnswers.length > 0) {
          apiBody.reviewAnswers = reviewAnswers;
        }

        const updatedIdea = await ideasApi.submitDevil(payload.ideaId, apiBody);

        dispatch({ type: "UPSERT_IDEA", payload: updatedIdea });
      } catch (error) {
        dispatch({
          type: "SET_API_STATUS",
          payload: { status: "fallback", error: error.message },
        });
        throw error;
      }
    },
    [state.ideas]
  );

  const fetchIdeaById = useCallback(async (ideaId) => {
    const idea = await ideasApi.get(ideaId);
    dispatch({ type: "UPSERT_IDEA", payload: idea });
    return idea;
  }, []);

  const runStrategicAnalysis = useCallback(
    async (ideaId, targetLanguage = "en", regenerate = false) => {
      const analysis = await ideasApi.analyzeDevilAdvocate(
        ideaId,
        targetLanguage,
        regenerate
      );
      const stored = { ...analysis };
      delete stored.cached;

      dispatch({
        type: "SET_STRATEGIC_ANALYSIS",
        payload: {
          ideaId,
          strategicAnalysis: stored,
        },
      });

      return stored;
    },
    []
  );

  const addComment = useCallback(
    async (ideaId, body) => {
      dispatch({ type: "ADD_COMMENT", payload: { ideaId, body } });

      try {
        const updatedIdea = await ideasApi.addComment(ideaId, {
          authorId: state.currentUser?.id,
          authorName: state.currentUser?.name,
          body,
        });

        dispatch({ type: "UPSERT_IDEA", payload: updatedIdea });
      } catch (error) {
        dispatch({
          type: "SET_API_STATUS",
          payload: { status: "fallback", error: error.message },
        });
      }
    },
    [state.currentUser]
  );

  const voteIdea = useCallback(async (ideaId) => {
    try {
      const result = await ideasApi.vote(ideaId);
      dispatch({
        type: "APPLY_VOTE",
        payload: {
          ideaId,
          votes: result.voteCount,
          voters: result.voters,
          voted: result.voted,
        },
      });
    } catch (error) {
      dispatch({
        type: "SET_API_STATUS",
        payload: { status: "fallback", error: error.message },
      });
    }
  }, []);

  const openMessagesWithUser = useCallback((peer) => {
    const pid = peer?.id != null ? String(peer.id) : "";
    if (pid) sessionStorage.setItem("socratix_messages_peer", pid);
  }, []);

  const getIdeaById = useCallback(
    (id) =>
      state.ideas.find((idea) => id != null && String(idea.id) === String(id)),
    [state.ideas]
  );

  const getFilteredIdeas = useCallback(
    (filterKey) => {
      const ideaTime = (idea) => {
        const ts = new Date(idea?.createdAt).getTime();
        return Number.isFinite(ts) ? ts : 0;
      };

      let list = [...state.ideas];

      if (filterKey === "department") {
        const departmentId = state.currentUser?.departmentId;
        if (!departmentId) {
          return [];
        }
        list = list.filter((idea) => idea.departmentId === departmentId);
      }

      if (filterKey === "popular") {
        list.sort((a, b) => {
          const vd = (b.votes || 0) - (a.votes || 0);
          if (vd !== 0) return vd;
          return ideaTime(b) - ideaTime(a);
        });
      } else if (filterKey === "new") {
        list.sort((a, b) => ideaTime(b) - ideaTime(a));
      } else {
        list.sort((a, b) => ideaTime(b) - ideaTime(a));
      }

      return list;
    },
    [state.ideas, state.currentUser]
  );

  const ideaVoters = useCallback(
    (idea) => {
      const raw = idea?.voters || [];
      return raw.map((entry) => {
        if (typeof entry === "string") {
          const known = lookupUser(entry);
          return {
            id: String(entry),
            name: known?.name || "User",
            avatarUrl: known?.avatarUrl || null,
          };
        }
        const voterId = String(entry.id);
        const known = lookupUser(voterId);
        return {
          id: voterId,
          name: entry.name || known?.name || "User",
          avatarUrl: resolveAvatarUrl(entry.avatarUrl) || known?.avatarUrl || null,
        };
      });
    },
    [lookupUser]
  );

  const hasVotedOnIdea = useCallback(
    (idea) => {
      const me = state.currentUser?.id;
      if (!me || !idea) return false;
      const meKey = String(me);
      return ideaVoters(idea).some((v) => String(v.id) === meKey);
    },
    [state.currentUser, ideaVoters]
  );

  const value = useMemo(
    () => ({
      ...state,
      dispatch,
      t: (key, vars) => translate(state.language, key, vars),
      setLanguage,
      removeToast,
      login,
      signUp,
      logout,
      loadIdeas,
      loadUserDirectory,
      lookupUser,
      updateSettings,
      updateProfile,
      uploadAvatar,
      removeAvatar,
      updateCreateDraft,
      resetCreateDraft,
      runAiImprove,
      acceptSuggestion,
      dismissSuggestion,
      acknowledgeSimilar,
      dismissSimilar,
      createIdeaFromDraft,
      updateIdea,
      deleteIdea,
      generateDevilQuestions,
      submitDevil,
      fetchIdeaById,
      runStrategicAnalysis,
      addComment,
      voteIdea,
      openMessagesWithUser,
      getIdeaById,
      getFilteredIdeas,
      ideaVoters,
      hasVotedOnIdea,
      getCategoryLabel,
    }),
    [
      state,
      setLanguage,
      removeToast,
      login,
      signUp,
      logout,
      loadIdeas,
      loadUserDirectory,
      lookupUser,
      updateSettings,
      updateProfile,
      uploadAvatar,
      removeAvatar,
      updateCreateDraft,
      resetCreateDraft,
      runAiImprove,
      acceptSuggestion,
      dismissSuggestion,
      acknowledgeSimilar,
      dismissSimilar,
      createIdeaFromDraft,
      updateIdea,
      deleteIdea,
      generateDevilQuestions,
      submitDevil,
      fetchIdeaById,
      runStrategicAnalysis,
      addComment,
      voteIdea,
      openMessagesWithUser,
      getIdeaById,
      getFilteredIdeas,
      ideaVoters,
      hasVotedOnIdea,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useSocratixStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useSocratixStore must be used within SocratixStoreProvider");
  }

  return ctx;
}