import { AuditEvent } from '../../../../shared/models/audit/audit.model';

export interface HistoryUser {
  _id: string;
  username: string;
}

export interface HistoryState {
  events: AuditEvent[];
  users: HistoryUser[];
  isLoading: boolean;
  isPurging: boolean;
}

export const initialHistoryState: HistoryState = {
  events: [],
  users: [],
  isLoading: false,
  isPurging: false,
};
