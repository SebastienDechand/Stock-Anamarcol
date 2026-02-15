export interface AuditEvent {
  _id: string;
  entity: string;
  entityId?: string;
  action: string;
  userName?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}
