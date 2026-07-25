import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Contact } from '../../../../shared/models/contact/contact.model';

export const ContactsActions = createActionGroup({
  source: 'Contacts',
  events: {
    'Load All': emptyProps(),
    'Load All Success': props<{ contacts: Contact[] }>(),
    'Load All Failure': props<{ error: string }>(),

    'Load One': props<{ id: string }>(),
    'Load One Success': props<{ contact: Contact }>(),
    'Load One Failure': props<{ error: string }>(),

    'Update Contact': props<{ id: string; data: Partial<Contact> }>(),
    'Update Contact Success': props<{ contact: Contact }>(),
    'Update Contact Failure': props<{ error: string }>(),

    'Upload Picture': props<{ id: string; formData: FormData }>(),
    'Upload Picture Success': props<{ contact: Contact }>(),
    'Upload Picture Failure': props<{ error: string }>(),

    'Set Selected Id': props<{ id: string | null }>(),
  },
});
