import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  InterventionReport,
  InterventionReportForm,
} from '../../../../shared/models/intervention-report/intervention-report.model';

export const InterventionReportsActions = createActionGroup({
  source: 'Intervention Reports',
  events: {
    'Load All': emptyProps(),
    'Load All Success': props<{ reports: InterventionReport[] }>(),
    'Load All Failure': props<{ error: string }>(),

    'Load By Client File': props<{ clientFileId: string }>(),
    'Load By Client File Success': props<{ reports: InterventionReport[] }>(),

    'Load One': props<{ id: string }>(),
    'Load One Success': props<{ report: InterventionReport }>(),

    'Create Report': props<{ data: Partial<InterventionReportForm> }>(),
    'Create Report Success': props<{ report: InterventionReport }>(),
    'Create Report Failure': props<{ error: string }>(),

    'Update Report': props<{ id: string; data: Partial<InterventionReportForm> }>(),
    'Update Report Success': props<{ report: InterventionReport }>(),
    'Update Report Failure': props<{ error: string }>(),

    'Delete Report': props<{ id: string }>(),
    'Delete Report Success': props<{ id: string }>(),
    'Delete Report Failure': props<{ error: string }>(),

    'Set Selected': props<{ report: InterventionReport | null }>(),
  },
});
