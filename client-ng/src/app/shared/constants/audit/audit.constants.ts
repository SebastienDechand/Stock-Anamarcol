export interface ActionInfo {
  label: string;
  color?: string;
}

export interface EntityInfo {
  label: string;
}

export const ACTION_MAP: Record<string, ActionInfo> = {
  login: { label: 'HISTORY.LOGIN', color: 'success' },
  create: { label: 'HISTORY.ADD', color: 'info' },
  delete: { label: 'HISTORY.DELETE', color: 'danger' },
  update: { label: 'HISTORY.EDIT', color: 'warning' },
  move: { label: 'HISTORY.MOVE', color: 'info' },
  upload: { label: 'HISTORY.UPLOAD', color: 'info' },
  upload_document: { label: 'HISTORY.UPLOAD_DOC', color: 'info' },
  delete_document: { label: 'HISTORY.DELETE_DOC', color: 'danger' },
  logout: { label: 'HISTORY.LOGOUT', color: 'muted' },
  quantity_change: { label: 'HISTORY.QTY_CHANGE', color: 'warning' },
};

export const ENTITY_MAP: Record<string, EntityInfo> = {
  user: { label: 'HISTORY.ENTITY_USER' },
  item: { label: 'HISTORY.ENTITY_ITEM' },
  contact: { label: 'HISTORY.ENTITY_CONTACT' },
  vehicle: { label: 'HISTORY.ENTITY_VEHICLE' },
  clientFile: { label: 'HISTORY.ENTITY_CLIENT_FILE' },
  interventionReport: { label: 'HISTORY.ENTITY_REPORT' },
  shipment: { label: 'HISTORY.ENTITY_SHIPMENT' },
};

export const DEFAULT_ACTION: ActionInfo = { label: 'HISTORY.ACTION_DEFAULT', color: 'muted' };
