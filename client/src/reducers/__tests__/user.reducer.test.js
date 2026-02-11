import userReducer from "../user.reducer";

// Constants duplicated to avoid importing axios in tests
const GET_USER = "GET_USER";
const UPLOAD_PICTURE = "UPLOAD_PICTURE";
const UPDATE_NUMERO = "UPDATE_NUMERO";

describe("userReducer", () => {
  const initialState = {};

  it("should return the initial state", () => {
    const state = userReducer(undefined, { type: "@@INIT" });
    expect(state).toEqual(initialState);
  });

  it("should handle GET_USER", () => {
    const user = { _id: "1", pseudo: "admin", email: "admin@test.com" };
    const state = userReducer(initialState, {
      type: GET_USER,
      payload: user,
    });
    expect(state).toEqual(user);
  });

  it("should handle UPLOAD_PICTURE", () => {
    const currentState = { _id: "1", pseudo: "admin", picture: "old.jpg" };
    const state = userReducer(currentState, {
      type: UPLOAD_PICTURE,
      payload: "new.jpg",
    });
    expect(state.picture).toBe("new.jpg");
    expect(state.pseudo).toBe("admin");
  });

  it("should handle UPDATE_NUMERO", () => {
    const currentState = { _id: "1", pseudo: "admin", numero: "0600000000" };
    const state = userReducer(currentState, {
      type: UPDATE_NUMERO,
      payload: "0611111111",
    });
    expect(state.numero).toBe("0611111111");
    expect(state.pseudo).toBe("admin");
  });

  it("should not modify state for an unknown action", () => {
    const currentState = { _id: "1", pseudo: "test" };
    const state = userReducer(currentState, { type: "UNKNOWN" });
    expect(state).toEqual(currentState);
  });
});
