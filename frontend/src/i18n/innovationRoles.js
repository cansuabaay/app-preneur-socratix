export const DEFAULT_INNOVATION_ROLE = "innovation_contributor";

export function innovationRoleLabel(slug, t) {
  const role = slug || DEFAULT_INNOVATION_ROLE;
  const key = `innovationRoles.${role}`;
  const label = t(key);
  return label !== key ? label : t(`innovationRoles.${DEFAULT_INNOVATION_ROLE}`);
}
