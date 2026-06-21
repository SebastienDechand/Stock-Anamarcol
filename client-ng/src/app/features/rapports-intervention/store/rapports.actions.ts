import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  InterventionReport,
  InterventionReportForm,
} from '../../../shared/models/intervention-report.model';

export const RapportsActions = createActionGroup({
  source: 'Rapports',
  events: {
    'Load All': emptyProps(),
    'Load All Success': props<{ rapports: InterventionReport[] }>(),
    'Load All Failure': props<{ error: string }>(),

    'Load By Client File': props<{ clientFileId: string }>(),
    'Load By Client File Success': props<{ rapports: InterventionReport[] }>(),

    'Load One': props<{ id: string }>(),
    'Load One Success': props<{ rapport: InterventionReport }>(),

    'Create Rapport': props<{ data: Partial<InterventionReportForm> }>(),
    'Create Rapport Success': props<{ rapport: InterventionReport }>(),
    'Create Rapport Failure': props<{ error: string }>(),

    'Update Rapport': props<{ id: string; data: Partial<InterventionReportForm> }>(),
    'Update Rapport Success': props<{ rapport: InterventionReport }>(),
    'Update Rapport Failure': props<{ error: string }>(),

    'Delete Rapport': props<{ id: string }>(),
    'Delete Rapport Success': props<{ id: string }>(),
    'Delete Rapport Failure': props<{ error: string }>(),

    'Set Selected': props<{ rapport: InterventionReport | null }>(),
  },
});
