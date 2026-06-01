import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Icon from "../components/ds/Icon";
import { categories } from "../data/mockData";
import { useSocratixStore } from "../data/SocratixStoreProvider";
import { useTranslation } from "../i18n/useTranslation";

export default function EditIdeaPage() {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const { getIdeaById, currentUser, updateIdea } = useSocratixStore();
  const { t } = useTranslation();
  const idea = getIdeaById(ideaId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("cat-product");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const isOwner =
    idea &&
    currentUser &&
    String(idea.authorId) === String(currentUser.id);

  useEffect(() => {
    if (!idea) {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (!isOwner) {
      navigate(`/ideas/${idea.id}`, { replace: true });
      return;
    }
    setTitle(idea.title || "");
    setDescription(idea.description || "");
    setCategoryId(idea.categoryId || "cat-product");
  }, [idea, isOwner, navigate]);

  if (!idea || !isOwner) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFormError(t("edit.errRequired"));
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      await updateIdea(idea.id, {
        title: title.trim(),
        description: description.trim(),
        categoryId,
      });
      navigate(`/ideas/${idea.id}`, { replace: true });
    } catch (err) {
      setFormError(err?.message || t("edit.errSave"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="ds-row">
        <Link to={`/ideas/${idea.id}`} className="ds-btn ds-btn-ghost ds-btn-sm">
          {t("edit.back")}
        </Link>
      </div>

      <div>
        <h1 className="ds-heading-1">{t("edit.title")}</h1>
        <p className="ds-body" style={{ marginTop: "var(--space-2)" }}>
          {t("edit.subtitle")}
        </p>
      </div>

      {formError && (
        <div className="ds-alert ds-alert-error">{formError}</div>
      )}

      <form className="ds-stack" onSubmit={handleSave}>
        <div>
          <label className="ds-label" htmlFor="edit-idea-title">{t("create.titleLabel")}</label>
          <input
            id="edit-idea-title"
            type="text"
            className="ds-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("create.titlePlaceholder")}
          />
        </div>

        <div>
          <label className="ds-label" htmlFor="edit-idea-desc">{t("create.descriptionLabel")}</label>
          <textarea
            id="edit-idea-desc"
            className="ds-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("create.descriptionPlaceholder")}
            rows={6}
          />
        </div>

        <div>
          <label className="ds-label" htmlFor="edit-idea-cat">{t("create.categoryLabel")}</label>
          <select
            id="edit-idea-cat"
            className="ds-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="ds-row" style={{ flexWrap: "wrap" }}>
          <button
            type="submit"
            className="ds-btn ds-btn-primary"
            disabled={saving}
            style={{ gap: "var(--space-2)" }}
          >
            {saving ? t("edit.saving") : t("edit.save")}
            {!saving && <Icon name="chevronRight" size={17} />}
          </button>
          <Link to={`/ideas/${idea.id}`} className="ds-btn ds-btn-ghost">
            {t("edit.cancel")}
          </Link>
        </div>
      </form>
    </AppShell>
  );
}
