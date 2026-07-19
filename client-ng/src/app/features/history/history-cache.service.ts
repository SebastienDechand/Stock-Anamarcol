import { Injectable } from '@angular/core';
import { AuditEvent } from '../../shared/models/audit.model';

@Injectable({ providedIn: 'root' })
export class HistoryCacheService {
  events: AuditEvent[] = [];
  users: { _id: string; username: string }[] = [];
}
