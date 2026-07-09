import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Role } from '../../shared/constants/roles.constants';
import { User } from '../../shared/models/user.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Check Session': emptyProps(),
    'Check Session Success': props<{ uid: string; roles: Role[] }>(),
    'Check Session Failure': emptyProps(),

    Login: props<{ email: string; password: string }>(),
    'Login Success': emptyProps(),
    'Login Failure': props<{ error: string }>(),

    Logout: emptyProps(),
    'Logout Success': emptyProps(),

    'Load User Profile': props<{ uid: string }>(),
    'Load User Profile Success': props<{ user: User }>(),
    'Load User Profile Failure': emptyProps(),

    'Update User Profile': props<{ uid: string; data: Partial<User> }>(),
    'Update User Profile Success': props<{ user: User }>(),
  },
});
