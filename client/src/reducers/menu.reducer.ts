import type { MenuState, ReduxAction } from "../types";

const TOGGLE_MENU = "TOGGLE_MENU";

const initialState: MenuState = {
  isMenuOpen: true,
};

export default function menuReducer(
  state = initialState,
  action: ReduxAction,
): MenuState {
  switch (action.type) {
    case TOGGLE_MENU:
      return {
        ...state,
        isMenuOpen: !state.isMenuOpen,
      };
    default:
      return state;
  }
}
