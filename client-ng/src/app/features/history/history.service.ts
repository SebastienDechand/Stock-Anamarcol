import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import { AuditEvent } from '../../shared/models/audit/audit.model';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private api = inject(ApiService);

  getEvents(): Observable<AuditEvent[]> {
    return this.api.get<AuditEvent[]>('api/history/');
  }

  getUsers(): Observable<{ _id: string; username: string }[]> {
    return this.api.get<{ _id: string; username: string }[]>('api/user/');
  }

  purge(): Observable<void> {
    return this.api.post<void>('api/history/purge', {});
  }
}
