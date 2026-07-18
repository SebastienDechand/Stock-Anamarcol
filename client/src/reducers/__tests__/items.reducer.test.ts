import itemsReducer from "../items.reducer";
import type { Item, ItemsState, ReduxAction } from "../../types";

const GET_ALL_ITEMS = "GET_ALL_ITEMS";
const FETCH_ITEMS_REQUEST = "FETCH_ITEMS_REQUEST";
const FETCH_ITEMS_SUCCESS = "FETCH_ITEMS_SUCCESS";
const FETCH_ITEMS_FAILURE = "FETCH_ITEMS_FAILURE";

describe("itemsReducer", () => {
  const initialState: ItemsState = {
    allItems: [],
    items: [],
    total: 0,
    page: 1,
    totalPages: 0,
    isLoading: false,
  };

  it("should return the initial state", () => {
    const state = itemsReducer(undefined, { type: "@@INIT" } as ReduxAction);
    expect(state).toEqual(initialState);
  });

  it("should handle GET_ALL_ITEMS (updates allItems, not items)", () => {
    const items = [
      { _id: "1", name: "Pièce A", quantity: 10 },
      { _id: "2", name: "Pièce B", quantity: 3 },
    ];
    const state = itemsReducer(initialState, {
      type: GET_ALL_ITEMS,
      payload: items,
    } as ReduxAction);
    expect(state.allItems).toEqual(items);
    expect(state.allItems).toHaveLength(2);
    expect(state.items).toEqual([]);
  });

  it("should handle FETCH_ITEMS_REQUEST", () => {
    const state = itemsReducer(initialState, {
      type: FETCH_ITEMS_REQUEST,
    } as ReduxAction);
    expect(state.isLoading).toBe(true);
  });

  it("should handle FETCH_ITEMS_SUCCESS", () => {
    const payload = {
      items: [{ _id: "1", name: "Pièce A", quantity: 10 }],
      total: 50,
      page: 2,
      totalPages: 5,
    };
    const state = itemsReducer(
      { ...initialState, isLoading: true },
      { type: FETCH_ITEMS_SUCCESS, payload } as ReduxAction,
    );
    expect(state.items).toEqual(payload.items);
    expect(state.total).toBe(50);
    expect(state.page).toBe(2);
    expect(state.totalPages).toBe(5);
    expect(state.isLoading).toBe(false);
  });

  it("should handle FETCH_ITEMS_FAILURE", () => {
    const state = itemsReducer(
      { ...initialState, isLoading: true },
      { type: FETCH_ITEMS_FAILURE } as ReduxAction,
    );
    expect(state.isLoading).toBe(false);
  });

  it("should not modify state for an unknown action", () => {
    const state = itemsReducer(initialState, {
      type: "UNKNOWN_ACTION",
    } as ReduxAction);
    expect(state).toEqual(initialState);
  });
});
