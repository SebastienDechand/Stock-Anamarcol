export enum Role {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  HOTLINE = 'hotline',
  MONTEUR = 'monteur',
  USER = 'user',
}

export const ROLES: Role[] = [Role.SUPERADMIN, Role.ADMIN, Role.HOTLINE, Role.MONTEUR, Role.USER];

export const ROLE_DISPLAY_ORDER: Role[] = [
  Role.USER,
  Role.HOTLINE,
  Role.MONTEUR,
  Role.ADMIN,
  Role.SUPERADMIN,
];

export const ROLE_LABEL_KEYS: Record<Role, string> = {
  [Role.USER]: 'ROLES.USER',
  [Role.HOTLINE]: 'ROLES.HOTLINE',
  [Role.MONTEUR]: 'ROLES.MONTEUR',
  [Role.ADMIN]: 'ROLES.ADMIN',
  [Role.SUPERADMIN]: 'ROLES.SUPERADMIN',
};
