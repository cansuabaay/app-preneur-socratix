import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  aiPackages,
  getCategoryLabel,
  resolveAiPackageId,
} from "./mockData";
import { authApi, ideasApi, persistAccessToken } from "../services/api";

const StoreContext = createContext(null);

const initialCreateDraft = () => ({
  title: "",
  description: "",
  categoryId: "cat-product",
  aiVisible: false,
  improvements: [],
  similarWarnings: [],
});

/** One coach thread per user id so sessions and accounts do not share message state. */
function createCoachWelcomeThreads(user) {
  const uid = user?.id != null ? String(user.id) : "session";
  const now = Date.now();
  return [
    {
      id: `t-coach-${uid}`,
      name: "Socratix Innovation Coach",
      role: "AI guide",
      avatarInitials: "SC",
      avatarColor: "#6366f1",
      messages: [
        {
          id: `m-${uid}-welcome-1`,
          from: "coach",
          body: "Welcome to your Socratix workspace! Share one idea this week and I'll help you stress-test it with the Devil's Advocate framework.",
          at: new Date(now - 3600_000 * 2).toISOString(),
        },
        {
          id: `m-${uid}-welcome-2`,
          from: "coach",
          body: "When you're ready, hit 'Create Idea' on the dashboard. I'll flag similar initiatives and help sharpen the framing before it reaches the steering committee.",
          at: new Date(now - 3600_000).toISOString(),
        },
      ],
    },
  ];
}

function readStoredLanguage() {
  try {
    if (typeof window === "undefined") return "en";
    return window.localStorage.getItem("socratix_language") === "tr" ? "tr" : "en";
  } catch {
    return "en";
  }
}

const initialState = {
  isAuthenticated: false,
  language: readStoredLanguage(),
  toasts: [],
  currentUser: null,
  ideas: [],
  createDraft: initialCreateDraft(),
  messageThreads: [],
  apiStatus: "idle",
  apiError: "",
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
    usersNav: "People",
    messageUser: "Message",
    usersSubtitle: "Colleagues registered on Socratix.",
    usersLoadError: "Could not load the directory.",
    usersEmpty: "No other colleagues in the directory yet.",
    vote: "Vote",
    voted: "Voted",
    whoVoted: "Who voted",
    settings: "Settings",
    logout: "Logout",
    voteCounted: "Your vote has been counted.",
    brandTagline: "Corporate innovation platform",
    loginWelcomeBack: "Welcome back",
    loginSignInBlurb: "to your innovation workspace.",
    loginEmailLabel: "Work email",
    loginPasswordLabel: "Password",
    loginEmailRequired: "Work email is required.",
    loginPasswordRequired: "Password is required.",
    loginInvalidCreds: "Invalid email or password",
    loginFailed: "Sign in failed",
    loginNewPrompt: "New to Socratix?",
    loginFooter: "Sign in uses the Socratix API — use the account you registered.",
    dashboardTitle: "Innovation feed",
    dashboardWelcome: "Welcome back, {name}. Here's what's moving.",
    dashboardWelcomeGuest: "Ideas shaping the future of the organisation.",
    filterAll: "All ideas",
    filterDepartment: "My department",
    filterPopular: "Popular",
    filterNew: "Newest",
    emptyFeed: "No ideas in this view yet.",
    emptyFeedCreate: "Be the first to submit one.",
    messagesSubtitle: "Discuss ideas and get coaching from your Socratix team.",
    messagesPlaceholder: "Write a message… (Enter to send)",
    teamMember: "Team member",
    statusDraft: "Draft",
    statusAiEnhanced: "AI Enhanced",
    statusDevilsAdvocate: "Devil's Advocate",
    statusPublished: "In Portfolio",
    forgotTitle: "Reset password",
    forgotSubtitle:
      "Enter your work email. If the account exists, you will get a reset token (shown here in development when the server allows it).",
    forgotEmailLabel: "Work email",
    forgotSend: "Send reset link",
    forgotBack: "← Back to sign in",
    forgotTokenLabel: "Reset token",
    forgotTokenHelp: "Paste the token returned by the server after the previous step.",
    forgotNewPassword: "New password",
    forgotConfirmPassword: "Confirm password",
    forgotSetPassword: "Update password",
    forgotStep2Title: "Choose a new password",
    forgotStep2Next: "Enter the token, then your new password.",
    forgotSuccessTitle: "Password updated",
    forgotSuccessBody: "You can sign in with your new password.",
    forgotGenericSent: "If this email is registered, follow the instructions you received.",
    forgotErrWeak: "Use at least 6 characters.",
    forgotErrMismatch: "Passwords do not match.",
    forgotErrRequest: "Could not start reset. Try again.",
    forgotErrReset: "Reset failed. Check token and try again.",
    profileLogoutHint: "All session state will be cleared.",
    signUpWorkspaceTitle: "Create your workspace",
    signUpWorkspaceSubtitle: "Set up your innovation profile — takes 30 seconds.",
    signUpFullName: "Full name",
    signUpPassword: "Password",
    signUpConfirmPassword: "Confirm password",
    signUpDepartment: "Department",
    signUpThemes: "Innovation themes you care about",
    signUpPasswordHint: "≥ 6 characters",
    signUpRepeatPassword: "Repeat password",
    signUpNameRequired: "Full name is required.",
    signUpEmailRequired: "Work email is required.",
    signUpPasswordTooShort: "Use at least 6 characters for your password.",
    signUpPasswordMismatch: "Passwords do not match.",
    signUpThemesRequired: "Select at least one innovation theme.",
    signUpFailed: "Registration failed",
    signUpAlreadyHave: "Already have access?",
    loadingEllipsis: "…",
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
    usersNav: "Kişiler",
    messageUser: "Mesaj",
    usersSubtitle: "Socratix'e kayıtlı çalışma arkadaşların.",
    usersLoadError: "Dizin yüklenemedi.",
    usersEmpty: "Dizinde henüz başka çalışma arkadaşın yok.",
    vote: "Oy ver",
    voted: "Oy verdin",
    whoVoted: "Kim oy verdi",
    settings: "Ayarlar",
    logout: "Çıkış yap",
    voteCounted: "Oyun kaydedildi.",
    brandTagline: "Kurumsal inovasyon platformu",
    loginWelcomeBack: "Tekrar hoş geldin",
    loginSignInBlurb: "inovasyon çalışma alanına.",
    loginEmailLabel: "İş e-postası",
    loginPasswordLabel: "Şifre",
    loginEmailRequired: "İş e-postası gerekli.",
    loginPasswordRequired: "Şifre gerekli.",
    loginInvalidCreds: "E-posta veya şifre hatalı",
    loginFailed: "Giriş başarısız",
    loginNewPrompt: "Socratix'te yeni misin?",
    loginFooter: "Giriş Socratix API ile yapılır — kayıtlı hesabını kullan.",
    dashboardTitle: "İnovasyon akışı",
    dashboardWelcome: "Tekrar hoş geldin, {name}. İşte nabız.",
    dashboardWelcomeGuest: "Kuruluşun geleceğini şekillendiren fikirler.",
    filterAll: "Tüm fikirler",
    filterDepartment: "Departmanım",
    filterPopular: "Popüler",
    filterNew: "En yeni",
    emptyFeed: "Bu görünümde henüz fikir yok.",
    emptyFeedCreate: "İlk gönderen sen ol.",
    messagesSubtitle: "Fikirleri tartış ve Socratix ekibinden koçluk al.",
    messagesPlaceholder: "Mesaj yaz… (Gönder: Enter)",
    teamMember: "Ekip üyesi",
    statusDraft: "Taslak",
    statusAiEnhanced: "AI ile güçlendirildi",
    statusDevilsAdvocate: "Şeytanın avukatı",
    statusPublished: "Portföyde",
    forgotTitle: "Şifre sıfırlama",
    forgotSubtitle:
      "İş e-postanı gir. Hesap varsa sıfırlama anahtarı alırsın (geliştirme ortamında sunucu izin veriyorsa burada gösterilir).",
    forgotEmailLabel: "İş e-postası",
    forgotSend: "Sıfırlama bağlantısı gönder",
    forgotBack: "← Girişe dön",
    forgotTokenLabel: "Sıfırlama anahtarı",
    forgotTokenHelp: "Önceki adımda sunucunun döndürdüğü anahtarı yapıştır.",
    forgotNewPassword: "Yeni şifre",
    forgotConfirmPassword: "Şifreyi doğrula",
    forgotSetPassword: "Şifreyi güncelle",
    forgotStep2Title: "Yeni şifre seç",
    forgotStep2Next: "Anahtarı gir, ardından yeni şifreni yaz.",
    forgotSuccessTitle: "Şifre güncellendi",
    forgotSuccessBody: "Yeni şifrenle giriş yapabilirsin.",
    forgotGenericSent: "Bu e-posta kayıtlıysa gelen talimatları izle.",
    forgotErrWeak: "En az 6 karakter kullan.",
    forgotErrMismatch: "Şifreler eşleşmiyor.",
    forgotErrRequest: "Sıfırlama başlatılamadı. Tekrar dene.",
    forgotErrReset: "Sıfırlama başarısız. Anahtarı kontrol et.",
    profileLogoutHint: "Oturum durumu temizlenir.",
    signUpWorkspaceTitle: "Çalışma alanını oluştur",
    signUpWorkspaceSubtitle: "İnovasyon profilini ayarla — yaklaşık 30 saniye.",
    signUpFullName: "Ad soyad",
    signUpPassword: "Şifre",
    signUpConfirmPassword: "Şifreyi doğrula",
    signUpDepartment: "Departman",
    signUpThemes: "İlgilendiğin inovasyon temaları",
    signUpPasswordHint: "≥ 6 karakter",
    signUpRepeatPassword: "Şifreyi tekrarla",
    signUpNameRequired: "Ad soyad gerekli.",
    signUpEmailRequired: "İş e-postası gerekli.",
    signUpPasswordTooShort: "Şifre en az 6 karakter olmalı.",
    signUpPasswordMismatch: "Şifreler eşleşmiyor.",
    signUpThemesRequired: "En az bir tema seç.",
    signUpFailed: "Kayıt başarısız",
    signUpAlreadyHave: "Zaten hesabın var mı?",
    loadingEllipsis: "…",
  },
};

function t(lang, key) {
  return I18N[lang]?.[key] ?? I18N.en[key] ?? key;
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
        ideas: action.payload,
      };

    case "UPSERT_IDEA": {
      const idea = action.payload;
      const exists = state.ideas.some((i) => i.id === idea.id);

      return {
        ...state,
        ideas: exists
          ? state.ideas.map((i) => (i.id === idea.id ? idea : i))
          : [idea, ...state.ideas],
      };
    }

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
      const { user, messageThreads: nextThreads } = action.payload;
      const name = user?.name || "";
      const id = user?.id != null ? String(user.id) : "";

      return {
        ...state,
        isAuthenticated: true,
        currentUser: {
          ...user,
          id,
          avatarInitials: makeInitials(name || "User"),
          title:
            user?.role === "employee"
              ? "Innovation Contributor"
              : user?.role || "Member",
          interests: Array.isArray(user?.interests) ? user.interests : [],
        },
        messageThreads: Array.isArray(nextThreads) ? nextThreads : [],
      };
    }

    case "LOG_OUT":
      return {
        ...initialState,
        language: readStoredLanguage(),
        ideas: state.ideas,
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
          improvements: pkg.improvements.map((s) => ({
            ...s,
            status: "pending",
          })),
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
      const newIdea = action.payload.idea;

      return {
        ...state,
        ideas: [
          newIdea,
          ...state.ideas.filter((idea) => idea.id !== newIdea.id),
        ],
        createDraft: initialCreateDraft(),
      };
    }

    case "SUBMIT_DEVIL": {
      const { ideaId, answers, skipped } = action.payload;

      return {
        ...state,
        ideas: state.ideas.map((idea) =>
          idea.id === ideaId
            ? {
                ...idea,
                devilAnswers: answers,
                devilSkipped: skipped,
                progressStatus: "published",
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

    case "ENSURE_DM_THREAD": {
      const { peer } = action.payload;
      const pid = peer?.id != null ? String(peer.id) : "";
      if (!pid) return state;

      const threadId = `t-peer-${pid}`;
      if (state.messageThreads.some((th) => th.id === threadId)) return state;

      const peerName = peer.name || "Colleague";
      const newThread = {
        id: threadId,
        name: peerName,
        role:
          peer.role === "employee"
            ? "Team member"
            : peer.role || "Colleague",
        avatarInitials: makeInitials(peerName),
        avatarColor: "#0d9488",
        messages: [],
      };

      return {
        ...state,
        messageThreads: [...state.messageThreads, newThread],
      };
    }

    case "SEND_MESSAGE": {
      const { threadId, body } = action.payload;

      return {
        ...state,
        messageThreads: state.messageThreads.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                messages: [
                  ...thread.messages,
                  {
                    id: `m-${Date.now()}`,
                    from: "me",
                    body,
                    at: new Date().toISOString(),
                  },
                ],
              }
            : thread
        ),
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

    ideasApi
      .list()
      .then((ideas) => {
        if (!active) return;

        dispatch({ type: "SET_IDEAS", payload: ideas });
        dispatch({ type: "SET_API_STATUS", payload: { status: "ready" } });
      })
      .catch((error) => {
        if (!active) return;

        dispatch({
          type: "SET_API_STATUS",
          payload: { status: "fallback", error: error.message },
        });
      });

    return () => {
      active = false;
    };
  }, []);

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
          payload: {
            user,
            messageThreads: createCoachWelcomeThreads(user),
          },
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
      payload: {
        user: data.user,
        messageThreads: createCoachWelcomeThreads(data.user),
      },
    });
  }, []);

  const signUp = useCallback(async (payload) => {
    const { name, email, password, departmentId } = payload;
    const data = await authApi.register({
      name,
      email,
      password,
      departmentId,
    });
    persistAccessToken(data);
    dispatch({
      type: "SIGN_UP",
      payload: { user: data.user, messageThreads: [] },
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("socratix_token");
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

  const createIdeaFromDraft = useCallback(async () => {
    if (!state.currentUser) return null;

    const draft = state.createDraft;
    const packageId = resolveAiPackageId(draft.categoryId);
    const aiPackage = aiPackages[packageId] || aiPackages["pkg-product"];

    const fallbackIdea = {
      id: `idea-${Date.now()}`,
      title: draft.title.trim(),
      description: draft.description.trim(),
      categoryId: draft.categoryId,
      departmentId: state.currentUser.departmentId,
      authorId: state.currentUser.id,
      authorName: state.currentUser.name,
      votes: 0,
      progressStatus: "devils_advocate",
      aiReviewed: Boolean(draft.aiVisible),
      createdAt: new Date().toISOString(),
      comments: [],
      devilQuestions: aiPackage.devilQuestions,
      devilAnswers: [],
      devilSkipped: false,
      aiPackageId: packageId,
      voters: [],
    };

    try {
      const savedIdea = await ideasApi.create(fallbackIdea);
      dispatch({
        type: "CREATE_IDEA_FROM_DRAFT",
        payload: { idea: savedIdea },
      });

      return savedIdea.id;
    } catch (error) {
      dispatch({
        type: "CREATE_IDEA_FROM_DRAFT",
        payload: { idea: fallbackIdea },
      });
      dispatch({
        type: "SET_API_STATUS",
        payload: { status: "fallback", error: error.message },
      });

      return fallbackIdea.id;
    }
  }, [state.currentUser, state.createDraft]);

  const submitDevil = useCallback(
    async (payload) => {
      dispatch({ type: "SUBMIT_DEVIL", payload });

      try {
        const currentIdea = state.ideas.find(
          (idea) => idea.id === payload.ideaId
        );

        const updatedIdea = await ideasApi.submitDevil(payload.ideaId, {
          answers: payload.answers,
          questions: currentIdea?.devilQuestions || [],
          skipped: payload.skipped,
        });

        dispatch({ type: "UPSERT_IDEA", payload: updatedIdea });
      } catch (error) {
        dispatch({
          type: "SET_API_STATUS",
          payload: { status: "fallback", error: error.message },
        });
      }
    },
    [state.ideas]
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

  const voteIdea = useCallback(
    async (ideaId) => {
      dispatch({ type: "VOTE_IDEA", payload: { ideaId } });

      try {
        const updatedIdea = await ideasApi.vote(ideaId, state.currentUser?.id);
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

  const startDmWithUser = useCallback((peer) => {
    dispatch({ type: "ENSURE_DM_THREAD", payload: { peer } });
    const pid = peer?.id != null ? String(peer.id) : "";
    if (pid) sessionStorage.setItem("socratix_focus_thread", `t-peer-${pid}`);
  }, []);

  const sendMessage = useCallback((threadId, body) => {
    dispatch({ type: "SEND_MESSAGE", payload: { threadId, body } });
  }, []);

  const getIdeaById = useCallback(
    (id) => state.ideas.find((idea) => idea.id === id),
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

  const getMockVoters = useCallback(
    (idea) => {
      const ids = idea?.voters || [];
      return ids.map((vid) => {
        const sid = String(vid);
        if (state.currentUser && sid === String(state.currentUser.id)) {
          return {
            id: sid,
            name: state.currentUser.name,
            avatarInitials: state.currentUser.avatarInitials,
          };
        }
        const compact = sid.replace(/-/g, "");
        return {
          id: sid,
          name: "Colleague",
          avatarInitials: (compact.slice(0, 2) || "—").toUpperCase(),
        };
      });
    },
    [state.currentUser]
  );

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
      loadIdeas,
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
      startDmWithUser,
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
      loadIdeas,
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
      startDmWithUser,
      getIdeaById,
      getFilteredIdeas,
      getMockVoters,
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