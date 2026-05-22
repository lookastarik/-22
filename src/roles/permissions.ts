// src/roles/permissions.ts
export type UserRole = 'demo' | 'investor' | 'admin';

export interface RolePermissions {
  canViewMap: boolean;
  canTrade: boolean;
  canViewPortfolio: boolean;
  canExportClean: boolean;
  canCreateAsset: boolean;
  canManageUsers: boolean;
  canAccessLogs: boolean;
  canRunScenarios: boolean;
  canManageSyndicates: boolean;
  canAccessSecondaryMarket: boolean;
  aiRateLimit: number | null; // null = unlimited
  showDemoWatermark: boolean;
  maxPortfolioSize: number | null; // null = unlimited
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  demo: {
    canViewMap: true,
    canTrade: false,
    canViewPortfolio: false,
    canExportClean: false,
    canCreateAsset: false,
    canManageUsers: false,
    canAccessLogs: false,
    canRunScenarios: false,
    canManageSyndicates: false,
    canAccessSecondaryMarket: false,
    aiRateLimit: 5,
    showDemoWatermark: true,
    maxPortfolioSize: 0
  },
  investor: {
    canViewMap: true,
    canTrade: true,
    canViewPortfolio: true,
    canExportClean: true,
    canCreateAsset: false,
    canManageUsers: false,
    canAccessLogs: false,
    canRunScenarios: true,
    canManageSyndicates: true,
    canAccessSecondaryMarket: true,
    aiRateLimit: null,
    showDemoWatermark: false,
    maxPortfolioSize: null
  },
  admin: {
    canViewMap: true,
    canTrade: true,
    canViewPortfolio: true,
    canExportClean: true,
    canCreateAsset: true,
    canManageUsers: true,
    canAccessLogs: true,
    canRunScenarios: true,
    canManageSyndicates: true,
    canAccessSecondaryMarket: true,
    aiRateLimit: null,
    showDemoWatermark: false,
    maxPortfolioSize: null
  }
};

export const useRoleAccess = (role: UserRole): RolePermissions => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.demo;
};

export const checkPermission = (
  role: UserRole,
  permission: keyof RolePermissions
): boolean => {
  const perms = ROLE_PERMISSIONS[role];
  return perms ? Boolean(perms[permission]) : false;
};
