export interface PoleInfo {
  label: string;
  roles?: string[];
}

export const POLES: PoleInfo[] = [{ label: 'Hotline' }, { label: 'Monteur' }];

export const POLE_ENTREPOT = 'Entrepôt';
export const POLE_DIRECTION = 'Direction';
export const POLE_GESTION = 'Gestion du site';

export const ALL_POLE_LABELS = [POLE_DIRECTION, 'Hotline', POLE_ENTREPOT, 'Monteur', POLE_GESTION];
