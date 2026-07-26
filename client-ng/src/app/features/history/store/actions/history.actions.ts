import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AuditEvent } from '../../../../shared/models/audit/audit.model';
import { HistoryUser } from '../state/history.state';

export const HistoryActions = createActionGroup({
  source: 'History',
  events: {
    'Load Events': emptyProps(),
    'Load Events Success': props<{ events: AuditEvent[] }>(),
    'Load Events Failure': props<{ error: string }>(),

    'Load Users': emptyProps(),
    'Load Users Success': props<{ users: HistoryUser[] }>(),
    'Load Users Failure': props<{ error: string }>(),

    Purge: emptyProps(),
    'Purge Success': emptyProps(),
    'Purge Failure': props<{ error: string }>(),
  },
});
