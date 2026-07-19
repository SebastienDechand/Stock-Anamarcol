import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from '../../../shared/models/user.model';
import { Role } from '../../../shared/constants/roles.constants';

export interface NewUserData {
  username: string;
  email: string;
  password: string;
  position?: string;
  phone?: string;
  department?: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  position?: string;
  phone?: string;
  department?: string;
}

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    'Load All Users': emptyProps(),
    'Load All Users Success': props<{ users: User[] }>(),
    'Load All Users Failure': props<{ error: string }>(),

    'Add User': props<{ data: NewUserData }>(),
    'Add User Success': emptyProps(),
    'Add User Failure': props<{ error: string }>(),

    'Delete User': props<{ id: string }>(),
    'Delete User Success': props<{ id: string }>(),
    'Delete User Failure': props<{ error: string }>(),

    'Update User': props<{ id: string; data: UpdateUserData }>(),
    'Update User Success': props<{ id: string; data: UpdateUserData }>(),
    'Update User Failure': props<{ error: string }>(),

    'Update Roles': props<{ id: string; roles: Role[] }>(),
    'Update Roles Success': props<{ id: string; roles: Role[] }>(),
    'Update Roles Failure': props<{ id: string; previousRoles: Role[]; error: string }>(),

    'Upload Picture': props<{ id: string; formData: FormData }>(),
    'Upload Picture Success': props<{ user: User }>(),
    'Upload Picture Failure': props<{ error: string }>(),
  },
});
