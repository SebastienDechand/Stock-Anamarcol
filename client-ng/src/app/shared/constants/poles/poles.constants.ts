export interface DepartmentInfo {
  label: string;
  roles?: string[];
}

export const DEPARTMENTS: DepartmentInfo[] = [{ label: 'Hotline' }, { label: 'Installer' }];

export const DEPARTMENT_WAREHOUSE = 'Warehouse';
export const DEPARTMENT_MANAGEMENT = 'Management';
export const DEPARTMENT_SITE_MANAGEMENT = 'Site Management';

export const ALL_DEPARTMENT_LABELS = [
  DEPARTMENT_MANAGEMENT,
  'Hotline',
  DEPARTMENT_WAREHOUSE,
  'Installer',
  DEPARTMENT_SITE_MANAGEMENT,
];

// Maps each canonical (English) department value stored in the DB to its i18n key
export const DEPARTMENT_LABEL_KEYS: Record<string, string> = {
  [DEPARTMENT_MANAGEMENT]: 'MEMBERS.DEPARTMENT_MANAGEMENT',
  Hotline: 'MEMBERS.DEPARTMENT_HOTLINE',
  [DEPARTMENT_WAREHOUSE]: 'MEMBERS.DEPARTMENT_WAREHOUSE',
  Installer: 'MEMBERS.DEPARTMENT_TECHNICIAN',
  [DEPARTMENT_SITE_MANAGEMENT]: 'MEMBERS.DEPARTMENT_SITE_MANAGEMENT',
};
