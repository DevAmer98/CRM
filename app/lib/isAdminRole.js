import { ROLES } from "./role";

const ADMIN_ROLE_VALUES = [
  ROLES.ADMIN,
  ROLES.DASHBOARD_ADMIN,
  ROLES.SALES_ADMIN,
  ROLES.PROCUREMENT_ADMIN,
  ROLES.HR_ADMIN,
].filter(Boolean);

export const isAdminRole = (role) => {
  if (!role) return false;

  const r = typeof role === "string" ? role : role.name;
  if (typeof r !== "string") return false;

  return ADMIN_ROLE_VALUES.map(a => a.toLowerCase()).includes(r.toLowerCase());
};

