import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  ClientFile,
  ClientFileForm,
} from '../../../../shared/models/client-file/client-file.model';

export const ClientFilesActions = createActionGroup({
  source: 'Client Files',
  events: {
    'Load All': emptyProps(),
    'Load All Success': props<{ files: ClientFile[] }>(),
    'Load All Failure': props<{ error: string }>(),

    'Load One': props<{ id: string }>(),
    'Load One Success': props<{ file: ClientFile }>(),
    'Load One Failure': props<{ error: string }>(),

    'Create File': props<{ data: Partial<ClientFileForm> }>(),
    'Create File Success': props<{ file: ClientFile }>(),
    'Create File Failure': props<{ error: string }>(),

    'Update File': props<{ id: string; data: Partial<ClientFileForm> }>(),
    'Update File Success': props<{ file: ClientFile }>(),
    'Update File Failure': props<{ error: string }>(),

    'Delete File': props<{ id: string }>(),
    'Delete File Success': props<{ id: string }>(),
    'Delete File Failure': props<{ error: string }>(),

    'Upload Document': props<{ id: string; formData: FormData }>(),
    'Upload Document Success': props<{ file: ClientFile }>(),
    'Upload Document Failure': props<{ error: string }>(),

    'Delete Document': props<{ fileId: string; docId: string }>(),
    'Delete Document Success': props<{ file: ClientFile }>(),
    'Delete Document Failure': props<{ error: string }>(),

    'Set Selected': props<{ file: ClientFile | null }>(),
  },
});
