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
