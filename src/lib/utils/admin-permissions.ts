// Mirrors ev-csms-api's src/auth/permissions.ts — keep both in sync if the
// mapping changes. This copy drives what the operator UI shows/hides; the
// backend copy is the actual enforcement (hiding a nav item here is a UX
// nicety, not a security boundary — see PermissionsGuard on the API side).
export enum Permission {
  OperatorsManage = 'operators:manage',
  StationsView = 'stations:view',
  AuthorizationsManage = 'authorizations:manage',
  CrmManage = 'crm:manage',
  UsersManage = 'users:manage',
  RfidManage = 'rfid:manage',
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: Object.values(Permission),
  admin: [
    Permission.OperatorsManage,
    Permission.StationsView,
    Permission.AuthorizationsManage,
    Permission.CrmManage,
    Permission.RfidManage,
  ],
  ops: [Permission.StationsView, Permission.AuthorizationsManage, Permission.RfidManage],
  sales: [Permission.CrmManage],
};

export function roleHasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}
