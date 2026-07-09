import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { DashboardStats } from '../../../shared/models/statistics.model';

export const StatisticsActions = createActionGroup({
  source: 'Statistics',
  events: {
    'Load Dashboard': emptyProps(),
    'Load Dashboard Success': props<{ data: DashboardStats }>(),
    'Load Dashboard Failure': props<{ error: string }>(),
  },
});
