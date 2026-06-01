const STATUS_I18N = {
  draft: { key: "statusDraft", cls: "ds-badge-warning" },
  submitted: { key: "statusSubmitted", cls: "ds-badge-navy" },
};

/** Public idea statuses are only draft | submitted. */
export function normalizeProgressStatus(progressStatus) {
  return progressStatus === "draft" ? "draft" : "submitted";
}

export function getIdeaStatusBadge(progressStatus, t) {
  const normalized = normalizeProgressStatus(progressStatus);
  const info = STATUS_I18N[normalized];
  return { label: t(info.key), cls: info.cls };
}
