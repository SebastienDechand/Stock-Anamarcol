import { User } from '../../../../shared/models/user/user.model';

export interface UsersState {
  users: User[];
  loaded: boolean;
  isLoading: boolean;
  error: string | null;
  savingRoleIds: string[];
}

export const initialUsersState: UsersState = {
  users: [],
  loaded: false,
  isLoading: false,
  error: null,
  savingRoleIds: [],
};
