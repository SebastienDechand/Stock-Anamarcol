import AuditModel from '../../models/audit.model';

export async function logEvent(
  action: string,
  entity: string,
  entityId?: string,
  userName?: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    await AuditModel.create({
      action,
      entity,
      entityId,
      userName,
      details,
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export async function getRecentEvents(limit = 200, filter: Record<string, unknown> = {}) {
  return AuditModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
}
