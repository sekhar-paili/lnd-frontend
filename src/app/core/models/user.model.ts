export enum Role {
  LndAdmin = 'LND_ADMIN',
  Employee = 'EMPLOYEE',
  Partner = 'PARTNER',
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.LndAdmin]: 'L&D Admin',
  [Role.Employee]: 'Employee',
  [Role.Partner]: 'Partner',
};

export interface User {
  id: string;
  name: string;
  role: Role;
  group?: string;
  /**
   * Only present on the legacy JSON fixtures. The backend never returns
   * credentials, so these are optional and unused by real authentication.
   */
  username?: string;
  password?: string;
}
