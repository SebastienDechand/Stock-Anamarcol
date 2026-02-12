import itemsReducer from "../items.reducer";
import type { Item, ReduxAction } from "../../types";

const GET_ALL_ITEMS = "GET_ALL_ITEMS";

describe("itemsReducer", () => {
  const initialState = { items: [] as Item[] };

  it("should return the initial state", () => {
    const state = itemsReducer(undefined, { type: "@@INIT" } as ReduxAction);
    expect(state).toEqual(initialState);
  });

  it("should handle GET_ALL_ITEMS", () => {
    const items = [
      { _id: "1", denomination: "Pièce A", quantite: 10 },
      { _id: "2", denomination: "Pièce B", quantite: 3 },
    ];
    const state = itemsReducer(initialState, {
      type: GET_ALL_ITEMS,
      payload: items,
    } as ReduxAction);
    expect(state.items).toEqual(items);
    expect(state.items).toHaveLength(2);
  });

  it("should not modify state for an unknown action", () => {
    const state = itemsReducer(initialState, {
      type: "UNKNOWN_ACTION",
    } as ReduxAction);
    expect(state).toEqual(initialState);
  });
});
