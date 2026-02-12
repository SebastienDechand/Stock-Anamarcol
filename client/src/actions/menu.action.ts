import type { ReduxAction } from "../types";

export const toggleMenu = (): ReduxAction => ({
  type: "TOGGLE_MENU",
});
