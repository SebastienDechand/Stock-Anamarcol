import type { ThunkAction, ThunkDispatch } from "redux-thunk";
import type { Action } from "redux";
import { store } from "../index";

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = ThunkDispatch<RootState, unknown, Action>;
export type AppThunk<R = void> = ThunkAction<R, RootState, unknown, Action>;

export interface ReduxAction<T = unknown> {
  type: string;
  payload?: T;
}
