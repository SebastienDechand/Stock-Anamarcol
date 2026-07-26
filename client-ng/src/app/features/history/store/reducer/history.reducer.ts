import { createReducer, on } from '@ngrx/store';
import { HistoryActions } from '../actions/history.actions';
import { HistoryState, initialHistoryState } from '../state/history.state';

export const historyReducer = createReducer(
  initialHistoryState,
  on(
    HistoryActions.loadEvents,
    (state): HistoryState => ({
      ...state,
      isLoading: state.events.length === 0,
    }),
  ),
  on(
    HistoryActions.loadEventsSuccess,
    (state, { events }): HistoryState => ({
      ...state,
      events,
      isLoading: false,
    }),
  ),
  on(
    HistoryActions.loadEventsFailure,
    (state): HistoryState => ({
      ...state,
      isLoading: false,
    }),
  ),
  on(
    HistoryActions.loadUsersSuccess,
    (state, { users }): HistoryState => ({
      ...state,
      users,
    }),
  ),
  on(
    HistoryActions.purge,
    (state): HistoryState => ({
      ...state,
      isPurging: true,
    }),
  ),
  on(
    HistoryActions.purgeSuccess,
    (state): HistoryState => ({
      ...state,
      events: [],
      isPurging: false,
    }),
  ),
  on(
    HistoryActions.purgeFailure,
    (state): HistoryState => ({
      ...state,
      isPurging: false,
    }),
  ),
);
