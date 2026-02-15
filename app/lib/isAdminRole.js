import { ROLES } from "./role";

const ADMIN_ROLE_VALUES = [
  ROLES.ADMIN,
  ROLES.DASHBOARD_ADMIN,
  ROLES.SALES_ADMIN,
  ROLES.ACCOUNTANT_ADMIN,
  ROLES.PROCUREMENT_ADMIN,
  ROLES.HR_ADMIN,
].filter(Boolean);

export const isAdminRole = (role) => {
  if (typeof role !== "string") return false;
  const normalized = role.toLowerCase();
  return ADMIN_ROLE_VALUES.some(
    (adminRole) => typeof adminRole === "string" && adminRole.toLowerCase() === normalized
  );
};
