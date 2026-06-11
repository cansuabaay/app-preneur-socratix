import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import AiImprovementCards from "../components/ideas/AiImprovementCards";
import TranslatingIndicator from "../components/content/TranslatingIndicator";
import AiStrategicAnalysisPanel from "../components/ideas/AiStrategicAnalysisPanel";
import Icon from "../components/ds/Icon";
import ProfileAvatar from "../components/profile/ProfileAvatar";
import { getCategoryLabel, getDepartmentName, getUserById } from "../data/mockData";
import { useSocratixStore } from "../data/SocratixStoreProvider";
import { useIdeaTranslations } from "../hooks/useIdeaTranslations";
import { useReviewTranslations } from "../hooks/useReviewTranslations";
import { useTextTranslations } from "../hooks/useTextTranslations";
import { preloadIdeaDetailTranslations } from "../services/translationPreloader";
import { useTranslation } from "../i18n/useTranslation";
import { getIdeaStatusBadge } from "../i18n/statusLabels";
import { resolveAvatarUrl } from "../services/api";
import { resolveImprovementDisplay } from "../utils/aiImprovements";
import { parseAiRefinementsFromDescription } from "../utils/parseAiRefinements";
import { hasAiChallengeCompleted } from "../utils/reviewAnswers";
import { hasStrategicAnalysis, normalizeStrategicAnalysis } from "../utils/strategicAnalysis";

function UserAvatar({ userId, name, avatarUrl, size = 32 }) {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ProfileAvatar
      name={name}
      initials={initials}
      avatarUrl={avatarUrl}
      size={size}
      style={{
        fontSize: size * 0.3,
        border: "2px solid rgba(255,255,255,0.1)",
        boxShadow: "none",
      }}
    />
  );
}

export default function IdeaDetailPage() {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const {
    ideas,
    fetchIdeaById,
    runStrategicAnalysis,
    voteIdea,
    addComment,
    deleteIdea,
    currentUser,
    ideaVoters,
    hasVotedOnIdea,
    lookupUser,
  } = useSocratixStore();
  const { t, language } = useTranslation();
  const idea = useMemo(
    () => ideas.find((item) => ideaId != null && String(item.id) === String(ideaId)),
    [ideas, ideaId]
  );
  const ideaList = useMemo(() => (idea ? [idea] : []), [idea]);
  const { getDisplay, isLoading: isIdeaTranslating } = useIdeaTranslations(ideaList, language);
  const display = idea ? getDisplay(idea) : null;
  const [comment, setComment] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [ideaLoading, setIdeaLoading] = useState(true);
  const [pendingStrategicAnalysis, setPendingStrategicAnalysis] = useState(null);

  useEffect(() => {
    setPendingStrategicAnalysis(null);
  }, [ideaId]);

  const parsedDescription = useMemo(
    () => parseAiRefinementsFromDescription(idea?.description ?? ""),
    [idea?.description]
  );


  useEffect(() => {
    if (!ideaId) return;
    let active = true;
    setIdeaLoading(true);
    fetchIdeaById(ideaId)
      .catch(() => {})
      .finally(() => {
        if (active) setIdeaLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ideaId, fetchIdeaById]);

  useEffect(() => {
    if (!idea || ideaLoading) return;
    preloadIdeaDetailTranslations(
      {
        ...idea,
        strategicAnalysis: pendingStrategicAnalysis ?? idea.strategicAnalysis,
      },
      language
    );
  }, [idea, ideaLoading, language, pendingStrategicAnalysis]);

  const author = useMemo(() => {
    if (!idea) return "";
    return idea.authorName || getUserById(idea.authorId)?.name || t("teamMember");
  }, [idea, t]);

  const authorAvatarUrl = useMemo(() => {
    if (!idea) return null;
    const authorUser = lookupUser(idea.authorId);
    return resolveAvatarUrl(idea.authorAvatarUrl) || authorUser?.avatarUrl || null;
  }, [idea, lookupUser]);

  useEffect(() => {
    if (!ideaLoading && !idea) navigate("/dashboard", { replace: true });
  }, [idea, ideaLoading, navigate]);

  const {
    pairs: reviewPairs,
    hasAnswers: hasReviewAnswers,
    loading: translatingReview,
  } = useReviewTranslations(idea, language);

  const strategicAnalysisSource =
    pendingStrategicAnalysis ?? idea?.strategicAnalysis ?? null;

  const normalizedAiResult = useMemo(
    () => normalizeStrategicAnalysis(strategicAnalysisSource),
    [strategicAnalysisSource]
  );
  const savedStrategicAnalysis = Boolean(
    normalizeStrategicAnalysis(pendingStrategicAnalysis) || hasStrategicAnalysis(idea)
  );
  const showAiChallengedBadge = hasAiChallengeCompleted(idea);

  const detailTranslationItems = useMemo(() => {
    if (!idea) return [];

    const ideaId = String(idea.id);
    const bodyBundle = `idea-body-${ideaId}`;
    const embeddedBundle = `idea-embedded-refs-${ideaId}`;
    const analysisBundle = `idea-analysis-${ideaId}`;
    const commentsBundle = `comments-${ideaId}`;
    const items = [];

    if (parsedDescription.refinements.length > 0 && parsedDescription.body) {
      items.push({
        id: "desc-body",
        text: parsedDescription.body,
        bundleId: bodyBundle,
      });
    }

    parsedDescription.refinements.forEach((item, index) => {
      if (item.text) {
        items.push({
          id: `embedded-ref-${index}`,
          text: item.text,
          bundleId: embeddedBundle,
        });
      }
      if (item.title) {
        items.push({
          id: `embedded-ref-${index}-title`,
          text: item.title,
          bundleId: embeddedBundle,
        });
      }
    });

    if (normalizedAiResult) {
      if (normalizedAiResult.businessValueSummary) {
        items.push({
          id: "business-summary",
          text: normalizedAiResult.businessValueSummary,
          bundleId: analysisBundle,
        });
      }
      if (normalizedAiResult.validationSummary) {
        items.push({
          id: "validation-summary",
          text: normalizedAiResult.validationSummary,
          bundleId: analysisBundle,
        });
      }
      if (normalizedAiResult.recommendedNextStep) {
        items.push({
          id: "next-step",
          text: normalizedAiResult.recommendedNextStep,
          bundleId: analysisBundle,
        });
      }
      if (normalizedAiResult.impactLevel) {
        items.push({
          id: "impact-level",
          text: normalizedAiResult.impactLevel,
          bundleId: analysisBundle,
        });
      }
      (normalizedAiResult.strengths || []).forEach((item, index) => {
        if (item) {
          items.push({
            id: `strength-${index}`,
            text: item,
            bundleId: analysisBundle,
          });
        }
      });
      (normalizedAiResult.risks || []).forEach((item, index) => {
        if (item) {
          items.push({
            id: `risk-${index}`,
            text: item,
            bundleId: analysisBundle,
          });
        }
      });
    }

    [...(idea.comments || [])].reverse().forEach((comment) => {
      const body = String(comment?.body || "").trim();
      if (comment?.id && body) {
        items.push({
          id: String(comment.id),
          text: body,
          bundleId: commentsBundle,
        });
      }
    });

    return items;
  }, [idea, normalizedAiResult, parsedDescription.body, parsedDescription.refinements]);

  const detailPriorityGroups = useMemo(() => {
    const groups = [];
    if (detailTranslationItems.some((item) => item.id === "desc-body")) {
      groups.push(["desc-body"]);
    }

    const strategicPriority = [
      "validation-summary",
      "business-summary",
      "next-step",
      "impact-level",
    ];
    for (const id of strategicPriority) {
      if (detailTranslationItems.some((item) => item.id === id)) {
        groups.push([id]);
      }
    }

    const strengthIds = detailTranslationItems
      .map((item) => item.id)
      .filter((id) => String(id).startsWith("strength-"));
    if (strengthIds.length > 0) groups.push(strengthIds);

    const riskIds = detailTranslationItems
      .map((item) => item.id)
      .filter((id) => String(id).startsWith("risk-"));
    if (riskIds.length > 0) groups.push(riskIds);

    const embeddedIds = detailTranslationItems
      .map((item) => item.id)
      .filter((id) => String(id).startsWith("embedded-ref-"));
    if (embeddedIds.length > 0) groups.push(embeddedIds);

    const commentIds = detailTranslationItems
      .map((item) => item.id)
      .filter(
        (id) =>
          !String(id).startsWith("embedded-ref-") &&
          !String(id).startsWith("strength-") &&
          !String(id).startsWith("risk-") &&
          !["desc-body", "validation-summary", "business-summary", "next-step", "impact-level"].includes(
            String(id)
          )
      );
    if (commentIds.length > 0) groups.push(commentIds);

    return groups;
  }, [detailTranslationItems]);

  const { getText: getDetailText, isLoading: isDetailTextLoading } = useTextTranslations(
    detailTranslationItems,
    language,
    "idea-detail",
    { priorityGroups: detailPriorityGroups }
  );

  const displayEmbeddedRefinements = useMemo(
    () =>
      parsedDescription.refinements.map((item, index) => {
        const translatedText = getDetailText(`embedded-ref-${index}`, item.text);
        const translatedTitle = item.title
          ? getDetailText(`embedded-ref-${index}-title`, item.title)
          : "";
        const { title, description } = resolveImprovementDisplay({
          title: translatedTitle,
          text: translatedText,
        });
        return {
          id: item.id,
          text: description,
          title,
        };
      }),
    [parsedDescription.refinements, getDetailText]
  );

  const displayStrategicAnalysis = useMemo(() => {
    if (!normalizedAiResult) return null;
    return {
      ...normalizedAiResult,
      impactLevel: getDetailText("impact-level", normalizedAiResult.impactLevel),
      businessValueSummary: getDetailText(
        "business-summary",
        normalizedAiResult.businessValueSummary
      ),
      validationSummary: getDetailText(
        "validation-summary",
        normalizedAiResult.validationSummary
      ),
      recommendedNextStep: getDetailText(
        "next-step",
        normalizedAiResult.recommendedNextStep
      ),
      strengths: (normalizedAiResult.strengths || []).map((item, index) =>
        getDetailText(`strength-${index}`, item)
      ),
      risks: (normalizedAiResult.risks || []).map((risk, index) =>
        getDetailText(`risk-${index}`, risk)
      ),
    };
  }, [normalizedAiResult, getDetailText]);

  const descriptionBody =
    parsedDescription.refinements.length > 0
      ? getDetailText("desc-body", parsedDescription.body)
      : display?.description ?? idea?.description ?? "";

  const translatingStrategicSummary =
    isDetailTextLoading("validation-summary") ||
    isDetailTextLoading("business-summary");
  const translatingEmbeddedRefs = detailTranslationItems
    .map((item) => item.id)
    .some((id) => String(id).startsWith("embedded-ref-") && isDetailTextLoading(id));
  const translatingDescriptionBody = isDetailTextLoading("desc-body");

  if (ideaLoading && !idea) {
    return (
      <AppShell>
        <p className="ds-body-sm" style={{ color: "var(--color-text-muted)" }}>
          {t("loadingEllipsis")}
        </p>
      </AppShell>
    );
  }

  if (!idea) return null;

  const badge = getIdeaStatusBadge(idea.progressStatus, t);
  const isOwner = Boolean(
    currentUser?.id && String(idea.authorId) === String(currentUser.id)
  );
  const canResumeDevil = idea.progressStatus === "draft";
  const voters = ideaVoters(idea);
  const alreadyVoted = hasVotedOnIdea(idea);

  const handleVote = () => voteIdea(idea.id);

  const handleComment = () => {
    if (!comment.trim()) return;
    addComment(idea.id, comment);
    setComment("");
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(t("idea.deleteConfirm"));
    if (!confirmed) return;
    try {
      await deleteIdea(idea.id);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setAiError(err?.message || t("idea.deleteError"));
    }
  };

  const handleStrategicAnalysis = async (regenerate = false) => {
    setAiError("");
    setAiLoading(true);
    try {
      const result = await runStrategicAnalysis(
        idea.id,
        language === "tr" ? "tr" : "en",
        regenerate
      );
      setPendingStrategicAnalysis(result);
    } catch (err) {
      setAiError(err?.message || t("idea.aiAnalysisError"));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <AppShell>
      {/* Back nav */}
      <div className="ds-row" style={{ flexWrap: "wrap", gap: "var(--space-2)" }}>
        <Link to="/dashboard" className="ds-btn ds-btn-ghost ds-btn-sm">
          {t("idea.backFeed")}
        </Link>
        {isOwner && (
          <>
            <Link to={`/ideas/${idea.id}/edit`} className="ds-btn ds-btn-secondary ds-btn-sm">
              {t("idea.edit")}
            </Link>
            <button
              type="button"
              className="ds-btn ds-btn-danger ds-btn-sm"
              onClick={handleDelete}
            >
              {t("idea.delete")}
            </button>
          </>
        )}
        {!savedStrategicAnalysis && (
          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={() => handleStrategicAnalysis(false)}
            disabled={aiLoading}
            style={{ gap: "var(--space-2)" }}
          >
            <Icon name="sparkles" size={15} />
            {aiLoading ? t("idea.aiAnalyzing") : t("idea.aiDevil")}
          </button>
        )}
        {savedStrategicAnalysis && (
          <button
            type="button"
            className="ds-btn ds-btn-secondary ds-btn-sm"
            onClick={() => handleStrategicAnalysis(true)}
            disabled={aiLoading}
            style={{ gap: "var(--space-2)" }}
          >
            <Icon name="sparkles" size={15} />
            {aiLoading ? t("idea.aiAnalyzing") : t("idea.regenerateAnalysis")}
          </button>
        )}
        {canResumeDevil && (
          <Link to={`/devil/${idea.id}`} className="ds-btn ds-btn-secondary ds-btn-sm">
            {t("idea.continueDevil")}
          </Link>
        )}
      </div>

      {/* Main card */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "var(--radius-2xl)",
          overflow: "hidden",
        }}
      >
        {/* Header band */}
        <div
          style={{
            padding: "var(--space-6) var(--space-6) var(--space-5)",
            background: "linear-gradient(135deg, rgba(79,142,247,0.08), rgba(99,102,241,0.06))",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="idea-feed-card__top">
            <div className="ds-row" style={{ gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
              <span className={`ds-badge ${badge.cls}`}>{badge.label}</span>
              {showAiChallengedBadge && (
                <span className="ds-badge ds-badge-purple">{t("idea.aiReviewedBadge")}</span>
              )}
              {savedStrategicAnalysis && (
                <span className="ds-badge ds-badge-accent">{t("idea.aiStrategicAnalysisBadge")}</span>
              )}
            </div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {display?.categoryLabel ?? getCategoryLabel(idea.categoryId)}
            </span>
          </div>
          <h1
            className="ds-heading-2"
            style={{ marginTop: "var(--space-3)", lineHeight: "var(--leading-snug)" }}
          >
            {display?.title ?? idea.title}
          </h1>
          <TranslatingIndicator
            visible={idea ? isIdeaTranslating(idea.id) : false}
            style={{ marginTop: "var(--space-2)" }}
          />
          <div
            className="ds-row"
            style={{ marginTop: "var(--space-3)", gap: "var(--space-3)", flexWrap: "wrap" }}
          >
            <UserAvatar name={author} userId={idea.authorId} avatarUrl={authorAvatarUrl} size={28} />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              <strong style={{ color: "var(--color-text-primary)" }}>{author}</strong>
              {" · "}
              {getDepartmentName(idea.departmentId)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div style={{ padding: "var(--space-6)" }}>
          <p
            style={{
              fontSize: "var(--text-base)",
              color: "var(--color-text-secondary)",
              lineHeight: "var(--leading-relaxed)",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {descriptionBody}
          </p>
          <TranslatingIndicator
            visible={translatingDescriptionBody}
            style={{ marginTop: "var(--space-2)" }}
          />

          {displayEmbeddedRefinements.length > 0 && (
            <div style={{ marginTop: "var(--space-5)" }}>
              <TranslatingIndicator
                visible={translatingEmbeddedRefs}
                style={{ marginBottom: "var(--space-2)" }}
              />
              <AiImprovementCards
                title={t("idea.aiImprovementSectionTitle")}
                items={displayEmbeddedRefinements}
              />
            </div>
          )}

          <div
            className="ds-divider"
            style={{ margin: "var(--space-5) 0" }}
          />

          {/* Votes + who voted */}
          <div className="ds-row-between" style={{ flexWrap: "wrap", gap: "var(--space-4)" }}>
            <div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "var(--color-text-muted)",
                  marginBottom: "var(--space-2)",
                }}
              >
                {t("whoVoted")}
              </div>
              {voters.length > 0 ? (
                <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                  {voters.map((u) => (
                    <span
                      key={u.id}
                      title={u.name}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <UserAvatar
                        userId={u.id}
                        name={u.name}
                        avatarUrl={u.avatarUrl}
                        size={30}
                      />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                        {u.name}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  {t("idea.noVotes")}
                </span>
              )}
            </div>

            <button
              type="button"
              className={`ds-btn ${alreadyVoted ? "ds-btn-primary" : "ds-btn-secondary"}`}
              onClick={handleVote}
              style={{ gap: "var(--space-2)" }}
            >
              <Icon name="vote" size={16} />
              {alreadyVoted ? t("voted") : t("vote")}
              <span
                style={{
                  background: "rgba(79,142,247,0.2)",
                  color: "var(--color-brand)",
                  borderRadius: "var(--radius-full)",
                  padding: "1px 8px",
                  fontWeight: 800,
                  fontSize: "var(--text-xs)",
                }}
              >
                {idea.votes ?? 0}
              </span>
            </button>
          </div>
        </div>
      </div>

      {aiError && (
        <div className="ds-alert ds-alert-error" style={{ marginTop: "var(--space-4)" }}>
          {aiError}
        </div>
      )}

      {displayStrategicAnalysis && (
        <AiStrategicAnalysisPanel
          analysis={displayStrategicAnalysis}
          translatingSummary={translatingStrategicSummary}
          translatingDetails={
            isDetailTextLoading("next-step") ||
            isDetailTextLoading("impact-level") ||
            detailTranslationItems
              .map((item) => item.id)
              .some(
                (id) =>
                  (String(id).startsWith("strength-") || String(id).startsWith("risk-")) &&
                  isDetailTextLoading(id)
              )
          }
        />
      )}

      {/* AI review responses */}
      {!idea.devilSkipped && (
        <section className="ds-stack">
          <div>
            <h2 className="ds-heading-3" style={{ margin: 0 }}>
              {t("idea.aiReviewResponses")}
            </h2>
            <TranslatingIndicator
              visible={translatingReview}
              style={{ marginTop: "var(--space-2)" }}
            />
          </div>
          {hasReviewAnswers ? (
            reviewPairs.map((pair, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(168,85,247,0.06)",
                  border: "1px solid rgba(168,85,247,0.18)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-4) var(--space-5)",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--text-xs)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {t("idea.reviewQuestionLabel")}
                </p>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-primary)",
                    margin: "var(--space-2) 0 0",
                  }}
                >
                  {pair.question || "—"}
                </p>
                <p
                  style={{
                    margin: "var(--space-4) 0 0",
                    fontSize: "var(--text-xs)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {t("idea.reviewAnswerLabel")}
                </p>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-secondary)",
                    margin: "var(--space-2) 0 0",
                    lineHeight: "var(--leading-relaxed)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {pair.answer || "—"}
                </p>
              </div>
            ))
          ) : (
            <p className="ds-body-sm" style={{ color: "var(--color-text-muted)", margin: 0 }}>
              {t("idea.aiReviewEmpty")}
            </p>
          )}
        </section>
      )}

      {idea.devilSkipped && (
        <div className="ds-alert">
          {t("idea.aiReviewSkipped")}
        </div>
      )}

      {/* Discussion */}
      <section className="ds-stack">
        <div>
          <h2 className="ds-heading-3" style={{ margin: 0 }}>
            {t("idea.discussion")}
            {(idea.comments?.length ?? 0) > 0 && (
              <span
                style={{
                  marginLeft: "var(--space-2)",
                  background: "rgba(79,142,247,0.15)",
                  color: "var(--color-brand)",
                  borderRadius: "var(--radius-full)",
                  padding: "2px 10px",
                  fontSize: "var(--text-xs)",
                  fontWeight: 800,
                }}
              >
                {idea.comments.length}
              </span>
            )}
          </h2>
        </div>

        {(idea.comments || []).length === 0 ? (
          <p className="ds-body-sm">{t("idea.noComments")}</p>
        ) : (
          <div className="ds-stack-sm">
            {idea.comments.map((c) => {
              const who = c.authorName || getUserById(c.authorId)?.name || t("colleague");
              return (
                <div
                  key={c.id}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-4) var(--space-5)",
                  }}
                >
                  <div className="ds-row" style={{ gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                    <UserAvatar
                      userId={c.authorId}
                      name={who}
                      avatarUrl={lookupUser(c.authorId)?.avatarUrl}
                      size={26}
                    />
                    <div>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {who}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginLeft: "var(--space-2)" }}>
                        {new Date(c.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: "var(--leading-relaxed)", whiteSpace: "pre-wrap" }}>
                    {getDetailText(String(c.id), c.body)}
                  </p>
                  <TranslatingIndicator
                    visible={isDetailTextLoading(String(c.id))}
                    style={{ marginTop: "var(--space-1)" }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Add comment */}
        <div>
          <label
            className="ds-label"
            htmlFor="new-comment"
          >
            {currentUser
              ? t("idea.addCommentAs", { name: currentUser.name })
              : t("idea.addComment")}
          </label>
          <textarea
            id="new-comment"
            className="ds-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("idea.commentPlaceholder")}
            rows={3}
          />
          <button
            type="button"
            className="ds-btn ds-btn-primary"
            onClick={handleComment}
            disabled={!comment.trim()}
            style={{ marginTop: "var(--space-3)" }}
          >
            <Icon name="comment" size={15} />
            {t("idea.postComment")}
          </button>
        </div>
      </section>
    </AppShell>
  );
}
