import { Role } from '../../../shared/constants/roles/roles.constants';
import { User } from '../../../shared/models/user/user.model';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  uid: string | null;
  roles: Role[];
  user: User | null;
  isAdmin: boolean;
  isSuperadmin: boolean;
  isHotline: boolean;
  isMonteur: boolean;
  status: AuthStatus;
  loginError: string | null;
}

export const initialAuthState: AuthState = {
  uid: null,
  roles: [],
  user: null,
  isAdmin: false,
  isSuperadmin: false,
  isHotline: false,
  isMonteur: false,
  status: 'idle',
  loginError: null,
};
