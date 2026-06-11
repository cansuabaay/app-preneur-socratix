import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Icon from "../components/ds/Icon";
import ProfileAvatar, { accentColorForInitials } from "../components/profile/ProfileAvatar";
import { departments, getDepartmentName } from "../data/mockData";
import { useSocratixStore } from "../data/SocratixStoreProvider";
import { innovationRoleLabel } from "../i18n/innovationRoles";
import { useTranslation } from "../i18n/useTranslation";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function Toggle({ id, checked, onChange }) {
  return (
    <label className="ds-toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} />
      <span className="ds-toggle-track" />
    </label>
  );
}

function profileFormFromUser(user) {
  return {
    name: user?.name || "",
    departmentId: user?.departmentId || departments[0]?.id || "",
    jobTitle: user?.jobTitle || "",
    bio: user?.bio || "",
  };
}

function ProfileDetailRow({ label, children }) {
  return (
    <div
      className="ds-row-between"
      style={{
        gap: "var(--space-4)",
        padding: "var(--space-3) 0",
        borderBottom: "1px solid var(--glass-border)",
        flexWrap: "wrap",
      }}
    >
      <span
        className="ds-body-sm"
        style={{ color: "var(--color-text-muted)", minWidth: 120 }}
      >
        {label}
      </span>
      <span
        className="ds-body-sm"
        style={{
          color: "var(--color-text-primary)",
          fontWeight: 500,
          textAlign: "right",
          flex: "1 1 auto",
        }}
      >
        {children}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const {
    currentUser,
    userSettings,
    updateSettings,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    logout,
  } = useSocratixStore();
  const { t, language, setLanguage } = useTranslation();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => profileFormFromUser(currentUser));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  useEffect(() => {
    if (currentUser && !editing) {
      setForm(profileFormFromUser(currentUser));
      resetPhotoDraft();
    }
  }, [currentUser, editing]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!currentUser) return null;

  const dept = getDepartmentName(currentUser.departmentId);
  const avatarColor = accentColorForInitials(currentUser.avatarInitials);
  const innovationRole = innovationRoleLabel(currentUser.innovationRole, t);

  const resetPhotoDraft = () => {
    setPendingAvatarFile(null);
    setRemovePhoto(false);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayAvatarUrl = editing
    ? removePhoto
      ? null
      : previewUrl || currentUser.avatarUrl
    : currentUser.avatarUrl;

  const handleStartEdit = () => {
    setForm(profileFormFromUser(currentUser));
    setFormError("");
    resetPhotoDraft();
    setEditing(true);
  };

  const handleCancel = () => {
    setForm(profileFormFromUser(currentUser));
    setFormError("");
    resetPhotoDraft();
    setEditing(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormError(t("profile.invalidImageType"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setFormError(t("profile.imageTooLarge"));
      return;
    }

    setFormError("");
    setRemovePhoto(false);
    setPendingAvatarFile(file);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setFormError("");
    setPendingAvatarFile(null);
    setRemovePhoto(true);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError(t("profile.nameRequired"));
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      if (pendingAvatarFile) {
        await uploadAvatar(pendingAvatarFile);
      } else if (removePhoto && currentUser.avatarUrl) {
        await removeAvatar();
      }

      await updateProfile({
        name: form.name.trim(),
        departmentId: form.departmentId || null,
        jobTitle: form.jobTitle.trim() || null,
        bio: form.bio.trim() || null,
      });

      resetPhotoDraft();
      setEditing(false);
    } catch (err) {
      setFormError(err?.message || t("profile.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const hasStoredPhoto = Boolean(currentUser.avatarUrl);

  return (
    <AppShell>
      <div
        style={{
          borderRadius: "var(--radius-2xl)",
          overflow: "hidden",
          position: "relative",
          padding: "var(--space-8) var(--space-8) var(--space-6)",
          background: `linear-gradient(135deg, ${avatarColor}33 0%, rgba(99,102,241,0.18) 100%)`,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: `${avatarColor}22`,
            filter: "blur(40px)",
          }}
        />

        <div
          className="ds-row-between"
          style={{ position: "relative", flexWrap: "wrap", gap: "var(--space-4)" }}
        >
          <div className="ds-row" style={{ gap: "var(--space-5)", alignItems: "center" }}>
            <ProfileAvatar
              name={editing ? form.name || currentUser.name : currentUser.name}
              initials={
                editing
                  ? makeInitials(form.name || currentUser.name)
                  : currentUser.avatarInitials
              }
              avatarUrl={editing ? displayAvatarUrl : currentUser.avatarUrl}
              size={72}
            />
            <div>
              <h1 className="ds-heading-2">{editing ? form.name || currentUser.name : currentUser.name}</h1>
              <p className="ds-body-sm" style={{ marginTop: "var(--space-1)" }}>
                {(editing ? form.jobTitle : currentUser.jobTitle) || dept}
                {(editing ? form.jobTitle : currentUser.jobTitle) && (
                  <span style={{ color: "var(--color-text-muted)" }}> · {dept}</span>
                )}
              </p>
              <span className="ds-badge ds-badge-purple" style={{ marginTop: "var(--space-2)", display: "inline-block" }}>
                {innovationRole}
              </span>
            </div>
          </div>

          {!editing && (
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              onClick={handleStartEdit}
              style={{ gap: "var(--space-2)" }}
            >
              <Icon name="user" size={16} />
              {t("profile.editProfile")}
            </button>
          )}
        </div>

        {!editing && currentUser.bio && (
          <p
            className="ds-body-sm"
            style={{
              marginTop: "var(--space-5)",
              position: "relative",
              color: "var(--color-text-secondary)",
              lineHeight: "var(--leading-relaxed)",
              whiteSpace: "pre-wrap",
            }}
          >
            {currentUser.bio}
          </p>
        )}

      </div>

      {!editing && (
        <div
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-6)",
            backdropFilter: "var(--glass-blur)",
          }}
        >
          <h2 className="ds-heading-3" style={{ margin: "0 0 var(--space-4)" }}>
            {t("profile.accountDetails")}
          </h2>
          <ProfileDetailRow label={t("profile.fullName")}>{currentUser.name}</ProfileDetailRow>
          <ProfileDetailRow label={t("profile.email")}>{currentUser.email}</ProfileDetailRow>
          <ProfileDetailRow label={t("profile.department")}>{dept}</ProfileDetailRow>
          <ProfileDetailRow label={t("profile.jobTitle")}>
            {currentUser.jobTitle || t("profile.notSet")}
          </ProfileDetailRow>
          <ProfileDetailRow label={t("profile.innovationRole")}>
            <span className="ds-badge ds-badge-purple">{innovationRole}</span>
          </ProfileDetailRow>
        </div>
      )}

      {editing && (
        <div
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-6)",
            backdropFilter: "var(--glass-blur)",
          }}
          className="ds-stack"
        >
          <h2 className="ds-heading-3" style={{ margin: 0 }}>
            {t("profile.editProfile")}
          </h2>

          {formError && <div className="ds-alert ds-alert-error">{formError}</div>}

          <div className="ds-row" style={{ gap: "var(--space-5)", alignItems: "center", flexWrap: "wrap" }}>
            <ProfileAvatar
              name={form.name || currentUser.name}
              initials={makeInitials(form.name || currentUser.name)}
              avatarUrl={displayAvatarUrl}
              size={64}
            />
            <div className="ds-stack-sm">
              <span className="ds-label" style={{ margin: 0 }}>
                {hasStoredPhoto || previewUrl ? t("profile.changePhoto") : t("profile.uploadPhoto")}
              </span>
              <input
                ref={fileInputRef}
                id="profile-avatar-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <div className="ds-row" style={{ flexWrap: "wrap", gap: "var(--space-2)" }}>
                <button
                  type="button"
                  className="ds-btn ds-btn-secondary ds-btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t("profile.uploadPhoto")}
                </button>
                {(hasStoredPhoto || previewUrl) && !removePhoto && (
                  <button
                    type="button"
                    className="ds-btn ds-btn-ghost ds-btn-sm"
                    onClick={handleRemovePhoto}
                  >
                    {t("profile.removePhoto")}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="ds-label" htmlFor="profile-name">
              {t("profile.fullName")}
            </label>
            <input
              id="profile-name"
              type="text"
              className="ds-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="ds-label" htmlFor="profile-email">
              {t("profile.email")}
            </label>
            <input
              id="profile-email"
              type="email"
              className="ds-input"
              value={currentUser.email || ""}
              readOnly
              disabled
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            />
          </div>

          <div>
            <label className="ds-label" htmlFor="profile-dept">
              {t("profile.department")}
            </label>
            <select
              id="profile-dept"
              className="ds-select"
              value={form.departmentId}
              onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="ds-label" htmlFor="profile-job-title">
              {t("profile.jobTitle")}
            </label>
            <input
              id="profile-job-title"
              type="text"
              className="ds-input"
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              placeholder={t("signUpJobTitlePlaceholder")}
            />
          </div>

          <div>
            <span className="ds-label">{t("profile.innovationRole")}</span>
            <div style={{ marginTop: "var(--space-2)" }}>
              <span className="ds-badge ds-badge-purple">{innovationRole}</span>
              <p
                className="ds-body-sm"
                style={{ margin: "var(--space-2) 0 0", color: "var(--color-text-muted)" }}
              >
                {t("profile.innovationRoleHint")}
              </p>
            </div>
          </div>

          <div>
            <label className="ds-label" htmlFor="profile-bio">
              {t("profile.aboutMe")}
            </label>
            <textarea
              id="profile-bio"
              className="ds-textarea"
              rows={4}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder={t("profile.aboutMePlaceholder")}
            />
          </div>

          <div className="ds-row" style={{ flexWrap: "wrap", gap: "var(--space-3)" }}>
            <button
              type="button"
              className="ds-btn ds-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t("profile.saving") : t("profile.saveChanges")}
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              onClick={handleCancel}
              disabled={saving}
            >
              {t("profile.cancel")}
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-6)",
          backdropFilter: "var(--glass-blur)",
        }}
      >
        <div className="ds-row" style={{ marginBottom: "var(--space-4)", gap: "var(--space-3)" }}>
          <Icon name="settings" size={18} style={{ color: "var(--color-brand)" }} />
          <h2 className="ds-heading-3">{t("settings")}</h2>
        </div>

        <div className="ds-toggle-row">
          <span className="ds-toggle-label">{t("profile.emailComments")}</span>
          <Toggle
            id="notif-comments"
            checked={userSettings.emailNotifications}
            onChange={(e) => updateSettings({ emailNotifications: e.target.checked })}
          />
        </div>
        <div className="ds-toggle-row">
          <span className="ds-toggle-label">{t("profile.weeklyDigest")}</span>
          <Toggle
            id="notif-digest"
            checked={userSettings.weeklyDigest}
            onChange={(e) => updateSettings({ weeklyDigest: e.target.checked })}
          />
        </div>
        <div className="ds-toggle-row">
          <span className="ds-toggle-label">{t("profile.voteAlert")}</span>
          <Toggle
            id="notif-votes"
            checked={userSettings.ideaVoteAlerts}
            onChange={(e) => updateSettings({ ideaVoteAlerts: e.target.checked })}
          />
        </div>
        <div className="ds-toggle-row">
          <span className="ds-toggle-label">{t("profile.earlyAccess")}</span>
          <Toggle
            id="notif-ai"
            checked={userSettings.experimentalAi}
            onChange={(e) => updateSettings({ experimentalAi: e.target.checked })}
          />
        </div>
      </div>

      <div>
        <div className="ds-row" style={{ marginBottom: "var(--space-4)" }}>
          <button
            type="button"
            className="ds-btn ds-btn-secondary"
            onClick={() => setLanguage(language === "en" ? "tr" : "en")}
          >
            {language.toUpperCase()} / {(language === "en" ? "TR" : "EN")}
          </button>
        </div>
        <button
          type="button"
          className="ds-btn ds-btn-danger"
          onClick={handleLogout}
          style={{ display: "inline-flex", gap: "var(--space-2)" }}
        >
          <Icon name="logout" size={16} />
          {t("logout")}
        </button>
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            marginTop: "var(--space-2)",
          }}
        >
          {t("profileLogoutHint")}
        </p>
      </div>
    </AppShell>
  );
}

function makeInitials(name) {
  return (name || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
