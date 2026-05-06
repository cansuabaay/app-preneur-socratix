import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import {
  aiPackages,
  getCategoryLabel,
  initialIdeas,
  resolveAiPackageId,
  users,
} from "./mockData";

const StoreContext = createContext(null);

const initialCreateDraft = () => ({
  title: "",
  description: "",
  categoryId: "cat-product",
  aiVisible: false,
  improvements: [],
  similarWarnings: [],
});

const mockMessageThreads = [
  {
    id: "t-coach",
    name: "Socratix Innovation Coach",
    role: "AI guide",
    avatarInitials: "SC",
    avatarColor: "#6366f1",
    messages: [
      {
        id: "m1",
        from: "coach",
        body: "Welcome to your Socratix workspace! Share one idea this week and I'll help you stress-test it with the Devil's Advocate framework.",
        at: new Date(Date.now() - 3600_000 * 2).toISOString(),
      },
      {
        id: "m2",
        from: "coach",
        body: "When you're ready, hit 'Create Idea' on the dashboard. I'll flag similar initiatives and help sharpen the framing before it reaches the steering committee.",
        at: new Date(Date.now() - 3600_000).toISOString(),
      },
    ],
  },
  {
    id: "t-jordan",
    name: "Jordan Okonkwo",
    role: "Director, Supply Planning",
    avatarInitials: "JO",
    avatarColor: "#0d9488",
    messages: [
      {
        id: "m3",
        from: "jordan",
        body: "Hey! Did you see the packaging take-back idea I submitted? Would love your feedback on the logistics section.",
        at: new Date(Date.now() - 86400_000).toISOString(),
      },
    ],
  },
  {
    id: "t-amelia",
    name: "Amelia Chen",
    role: "Principal Engineer",
    avatarInitials: "AC",
    avatarColor: "#2563eb",
    messages: [
      {
        id: "m4",
        from: "amelia",
        body: "The vendor security questionnaire automation idea got 19 votes! Ops team is interested in pairing on a proof of concept.",
        at: new Date(Date.now() - 172800_000).toISOString(),
      },
    ],
  },
];

const initialState = {
  isAuthenticated: false,
  language: "en",
  toasts: [],
  currentUser: null,
  ideas: initialIdeas.map((idea) => ({ ...idea })),
  createDraft: initialCreateDraft(),
  messageThreads: mockMessageThreads,
  userSettings: {
    emailNotifications: true,
    weeklyDigest: true,
    experimentalAi: false,
    ideaVoteAlerts: true,
  },
};

function makeInitials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const I18N = {
  en: {
    login: "Login",
    signIn: "Sign in",
    signUp: "Sign Up",
    createAccount: "Create account",
    forgotPassword: "Forgot password?",
    dashboard: "Dashboard",
    createIdea: "Create Idea",
    messages: "Messages",
    profile: "Profile",
    vote: "Vote",
    voted: "Voted",
    whoVoted: "Who voted",
    settings: "Settings",
    logout: "Logout",
    voteCounted: "Your vote has been counted.",
  },
  tr: {
    login: "Giriş",
    signIn: "Giriş yap",
    signUp: "Kayıt ol",
    createAccount: "Hesap oluştur",
    forgotPassword: "Şifremi unuttum",
    dashboard: "Pano",
    createIdea: "Fikir oluştur",
    messages: "Mesajlar",
    profile: "Profil",
    vote: "Oy ver",
    voted: "Oy verdin",
    whoVoted: "Kim oy verdi",
    settings: "Ayarlar",
    logout: "Çıkış yap",
    voteCounted: "Oyun kaydedildi.",
  },
};

function t(lang, key) {
  return I18N[lang]?.[key] ?? I18N.en[key] ?? key;
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };

    case "ADD_TOAST":
      return { ...state, toasts: [...state.toasts, action.payload] };

    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload.id) };

    case "LOGIN": {
      const { email } = action.payload;
      const raw = email.split("@")[0].replace(/[._]/g, " ");
      const name = raw
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return {
        ...state,
        isAuthenticated: true,
        currentUser: {
          id: "u-session",
          name,
          email,
          departmentId: "dept-rd",
          interests: ["cat-product", "cat-efficiency"],
          title: "Innovation Contributor",
          avatarInitials: makeInitials(name),
        },
      };
    }

    case "SIGN_UP": {
      const { name, email, departmentId, interests } = action.payload;
      return {
        ...state,
        isAuthenticated: true,
        currentUser: {
          id: `u-self-${Date.now()}`,
          name,
          email,
          departmentId,
          interests,
          title: "Innovation Owner",
          avatarInitials: makeInitials(name),
        },
      };
    }

    case "LOG_OUT":
      return {
        ...initialState,
        ideas: state.ideas,
        messageThreads: state.messageThreads,
      };

    case "UPDATE_SETTINGS":
      return {
        ...state,
        userSettings: { ...state.userSettings, ...action.payload },
      };

    case "UPDATE_CREATE_DRAFT":
      return {
        ...state,
        createDraft: { ...state.createDraft, ...action.payload },
      };

    case "RESET_CREATE_DRAFT":
      return { ...state, createDraft: initialCreateDraft() };

    case "AI_IMPROVE": {
      const { categoryId } = state.createDraft;
      const pkgId = resolveAiPackageId(categoryId);
      const pkg = aiPackages[pkgId] || aiPackages["pkg-product"];
      return {
        ...state,
        createDraft: {
          ...state.createDraft,
          aiVisible: true,
          improvements: pkg.improvements.map((s) => ({ ...s, status: "pending" })),
          similarWarnings: pkg.similarWarnings.map((w) => ({
            ...w,
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
        description = description.trimEnd() + `\n\n[AI refinement] ${suggestion.text}`;
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
      if (!state.currentUser) return state;
      const d = state.createDraft;
      const pkgId = resolveAiPackageId(d.categoryId);
      const pkg = aiPackages[pkgId] || aiPackages["pkg-product"];
      const newId = action.payload?.id ?? `idea-${Date.now()}`;
      const newIdea = {
        id: newId,
        title: d.title.trim(),
        description: d.description.trim(),
        categoryId: d.categoryId,
        departmentId: state.currentUser.departmentId,
        authorId: state.currentUser.id,
        authorName: state.currentUser.name,
        votes: 0,
        progressStatus: "devils_advocate",
        aiReviewed: Boolean(d.aiVisible),
        createdAt: new Date().toISOString(),
        comments: [],
        devilQuestions: pkg.devilQuestions,
        devilAnswers: [],
        devilSkipped: false,
        aiPackageId: pkgId,
        voters: [],
      };
      return {
        ...state,
        ideas: [newIdea, ...state.ideas],
        createDraft: initialCreateDraft(),
      };
    }

    case "SUBMIT_DEVIL": {
      const { ideaId, answers, skipped } = action.payload;
      return {
        ...state,
        ideas: state.ideas.map((idea) =>
          idea.id === ideaId
            ? { ...idea, devilAnswers: answers, devilSkipped: skipped, progressStatus: "published" }
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

    case "VOTE_IDEA": {
      const { ideaId } = action.payload;
      const user = state.currentUser;
      let didVote = false;
      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== ideaId) return idea;
        const alreadyVoted = (idea.voters || []).includes(user?.id);
        if (alreadyVoted) return idea;
        didVote = true;
        return {
          ...idea,
          votes: (idea.votes || 0) + 1,
          voters: [...(idea.voters || []), ...(user ? [user.id] : [])],
        };
      });

      return {
        ...state,
        ideas: nextIdeas,
        toasts: didVote
          ? [...state.toasts, { id: `toast-${Date.now()}`, key: "voteCounted" }]
          : state.toasts,
      };
    }

    case "SEND_MESSAGE": {
      const { threadId, body } = action.payload;
      return {
        ...state,
        messageThreads: state.messageThreads.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  {
                    id: `m-${Date.now()}`,
                    from: "me",
                    body,
                    at: new Date().toISOString(),
                  },
                ],
              }
            : t
        ),
      };
    }

    default:
      return state;
  }
}

export function SocratixStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setLanguage = useCallback((language) => {
    dispatch({ type: "SET_LANGUAGE", payload: language });
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: "REMOVE_TOAST", payload: { id } });
  }, []);

  const login = useCallback((email) => {
    dispatch({ type: "LOGIN", payload: { email } });
  }, []);

  const signUp = useCallback((payload) => {
    dispatch({ type: "SIGN_UP", payload });
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: "LOG_OUT" });
  }, []);

  const updateSettings = useCallback((payload) => {
    dispatch({ type: "UPDATE_SETTINGS", payload });
  }, []);

  const updateCreateDraft = useCallback((payload) => {
    dispatch({ type: "UPDATE_CREATE_DRAFT", payload });
  }, []);

  const resetCreateDraft = useCallback(() => {
    dispatch({ type: "RESET_CREATE_DRAFT" });
  }, []);

  const runAiImprove = useCallback(() => {
    dispatch({ type: "AI_IMPROVE" });
  }, []);

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

  const createIdeaFromDraft = useCallback(() => {
    const newId = `idea-${Date.now()}`;
    dispatch({ type: "CREATE_IDEA_FROM_DRAFT", payload: { id: newId } });
    return newId;
  }, []);

  const submitDevil = useCallback((payload) => {
    dispatch({ type: "SUBMIT_DEVIL", payload });
  }, []);

  const addComment = useCallback((ideaId, body) => {
    dispatch({ type: "ADD_COMMENT", payload: { ideaId, body } });
  }, []);

  const voteIdea = useCallback((ideaId) => {
    dispatch({ type: "VOTE_IDEA", payload: { ideaId } });
  }, []);

  const sendMessage = useCallback((threadId, body) => {
    dispatch({ type: "SEND_MESSAGE", payload: { threadId, body } });
  }, []);

  const getIdeaById = useCallback(
    (id) => state.ideas.find((i) => i.id === id),
    [state.ideas]
  );

  const getFilteredIdeas = useCallback(
    (filterKey) => {
      let list = [...state.ideas];
      const deptId = state.currentUser?.departmentId;
      if (filterKey === "department" && deptId) {
        list = list.filter((i) => i.departmentId === deptId);
      }
      if (filterKey === "popular") {
        list.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      } else {
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return list;
    },
    [state.ideas, state.currentUser]
  );

  const getMockVoters = useCallback((idea) => {
    const count = idea.votes || 0;
    return users.slice(0, Math.min(count, users.length));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      dispatch,
      t: (key) => t(state.language, key),
      setLanguage,
      removeToast,
      login,
      signUp,
      logout,
      updateSettings,
      updateCreateDraft,
      resetCreateDraft,
      runAiImprove,
      acceptSuggestion,
      dismissSuggestion,
      acknowledgeSimilar,
      dismissSimilar,
      createIdeaFromDraft,
      submitDevil,
      addComment,
      voteIdea,
      sendMessage,
      getIdeaById,
      getFilteredIdeas,
      getMockVoters,
      getCategoryLabel,
    }),
    [
      state,
      setLanguage,
      removeToast,
      login,
      signUp,
      logout,
      updateSettings,
      updateCreateDraft,
      resetCreateDraft,
      runAiImprove,
      acceptSuggestion,
      dismissSuggestion,
      acknowledgeSimilar,
      dismissSimilar,
      createIdeaFromDraft,
      submitDevil,
      addComment,
      voteIdea,
      sendMessage,
      getIdeaById,
      getFilteredIdeas,
      getMockVoters,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useSocratixStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSocratixStore must be used within SocratixStoreProvider");
  return ctx;
}
