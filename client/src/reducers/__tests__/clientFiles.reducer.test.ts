import { describe, it, expect } from "vitest";
import clientFilesReducer from "../clientFiles.reducer";
import type { ClientFile, ClientFilesState, ReduxAction } from "../../types";

const GET_ALL_CLIENT_FILES = "GET_ALL_CLIENT_FILES";
const GET_CLIENT_FILE = "GET_CLIENT_FILE";
const SET_SELECTED_CLIENT_FILE = "SET_SELECTED_CLIENT_FILE";
const UPDATE_CLIENT_FILE = "UPDATE_CLIENT_FILE";
const DELETE_CLIENT_FILE = "DELETE_CLIENT_FILE";

const makeFile = (overrides: Partial<ClientFile> = {}): ClientFile => ({
  _id: "file1",
  nom: "DUPONT",
  prenom: "Jean",
  societe: "TestCorp",
  visitePreinstallation: false,
  saisirFichierProduit: false,
  decoupePlanMenuiserie: false,
  decoupePlanMarbrerie: false,
  equipement: {
    nbCashguard: 0,
    nbCaisses: 0,
    nbAutresMateriels: 0,
    nbBalancesCaisses: 0,
    licencesTactis: 0,
    licencesInno: 0,
    pcBackoffice: 0,
    borneAllergene: false,
    borneCommande: false,
    etiquettesElectronique: false,
    carteFidelite: false,
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("clientFilesReducer", () => {
  const initialState: ClientFilesState = {
    clientFiles: [],
    selectedClientFile: null,
    isLoading: false,
  };

  // ─── Initial state ────────────────────────────────────────
  it("should return the initial state", () => {
    const state = clientFilesReducer(undefined, {
      type: "@@INIT",
    } as ReduxAction);
    expect(state).toEqual(initialState);
  });

  it("should not modify state for an unknown action", () => {
    const state = clientFilesReducer(initialState, {
      type: "UNKNOWN",
    } as ReduxAction);
    expect(state).toEqual(initialState);
  });

  // ─── GET_ALL_CLIENT_FILES ─────────────────────────────────
  it("should handle GET_ALL_CLIENT_FILES and set files", () => {
    const files = [makeFile({ _id: "f1" }), makeFile({ _id: "f2" })];
    const state = clientFilesReducer(initialState, {
      type: GET_ALL_CLIENT_FILES,
      payload: files,
    } as ReduxAction);
    expect(state.clientFiles).toEqual(files);
    expect(state.clientFiles).toHaveLength(2);
    expect(state.isLoading).toBe(false);
  });

  it("should replace existing files on GET_ALL_CLIENT_FILES", () => {
    const existing: ClientFilesState = {
      ...initialState,
      clientFiles: [makeFile({ _id: "old" })],
    };
    const newFiles = [makeFile({ _id: "new1" }), makeFile({ _id: "new2" })];
    const state = clientFilesReducer(existing, {
      type: GET_ALL_CLIENT_FILES,
      payload: newFiles,
    } as ReduxAction);
    expect(state.clientFiles).toHaveLength(2);
    expect(state.clientFiles[0]._id).toBe("new1");
  });

  // ─── GET_CLIENT_FILE ──────────────────────────────────────
  it("should handle GET_CLIENT_FILE and set selectedClientFile", () => {
    const file = makeFile({ _id: "f1" });
    const state = clientFilesReducer(initialState, {
      type: GET_CLIENT_FILE,
      payload: file,
    } as ReduxAction);
    expect(state.selectedClientFile).toEqual(file);
    expect(state.clientFiles).toEqual([]); // unchanged
  });

  // ─── SET_SELECTED_CLIENT_FILE ─────────────────────────────
  it("should handle SET_SELECTED_CLIENT_FILE with a file", () => {
    const file = makeFile({ _id: "f2" });
    const state = clientFilesReducer(initialState, {
      type: SET_SELECTED_CLIENT_FILE,
      payload: file,
    } as ReduxAction);
    expect(state.selectedClientFile).toEqual(file);
  });

  it("should handle SET_SELECTED_CLIENT_FILE with null", () => {
    const current: ClientFilesState = {
      ...initialState,
      selectedClientFile: makeFile(),
    };
    const state = clientFilesReducer(current, {
      type: SET_SELECTED_CLIENT_FILE,
      payload: null,
    } as ReduxAction);
    expect(state.selectedClientFile).toBeNull();
  });

  // ─── UPDATE_CLIENT_FILE ───────────────────────────────────
  it("should handle UPDATE_CLIENT_FILE and replace the matching file", () => {
    const original = makeFile({ _id: "f1", nom: "DUPONT" });
    const other = makeFile({ _id: "f2", nom: "MARTIN" });
    const current: ClientFilesState = {
      ...initialState,
      clientFiles: [original, other],
    };
    const updated = makeFile({ _id: "f1", nom: "DURAND" });
    const state = clientFilesReducer(current, {
      type: UPDATE_CLIENT_FILE,
      payload: updated,
    } as ReduxAction);
    expect(state.clientFiles[0].nom).toBe("DURAND");
    expect(state.clientFiles[1].nom).toBe("MARTIN"); // unchanged
  });

  it("should update selectedClientFile if it matches the updated file", () => {
    const file = makeFile({ _id: "f1", nom: "OLD" });
    const current: ClientFilesState = {
      ...initialState,
      clientFiles: [file],
      selectedClientFile: file,
    };
    const updated = makeFile({ _id: "f1", nom: "NEW" });
    const state = clientFilesReducer(current, {
      type: UPDATE_CLIENT_FILE,
      payload: updated,
    } as ReduxAction);
    expect(state.selectedClientFile?.nom).toBe("NEW");
  });

  it("should NOT update selectedClientFile if it does not match", () => {
    const fileA = makeFile({ _id: "f1" });
    const fileB = makeFile({ _id: "f2", nom: "SELECTED" });
    const current: ClientFilesState = {
      ...initialState,
      clientFiles: [fileA, fileB],
      selectedClientFile: fileB,
    };
    const updated = makeFile({ _id: "f1", nom: "UPDATED" });
    const state = clientFilesReducer(current, {
      type: UPDATE_CLIENT_FILE,
      payload: updated,
    } as ReduxAction);
    expect(state.selectedClientFile?.nom).toBe("SELECTED");
  });

  // ─── DELETE_CLIENT_FILE ───────────────────────────────────
  it("should handle DELETE_CLIENT_FILE and remove the file", () => {
    const files = [makeFile({ _id: "f1" }), makeFile({ _id: "f2" })];
    const current: ClientFilesState = {
      ...initialState,
      clientFiles: files,
    };
    const state = clientFilesReducer(current, {
      type: DELETE_CLIENT_FILE,
      payload: "f1",
    } as ReduxAction);
    expect(state.clientFiles).toHaveLength(1);
    expect(state.clientFiles[0]._id).toBe("f2");
  });

  it("should set selectedClientFile to null on DELETE_CLIENT_FILE", () => {
    const file = makeFile({ _id: "f1" });
    const current: ClientFilesState = {
      ...initialState,
      clientFiles: [file],
      selectedClientFile: file,
    };
    const state = clientFilesReducer(current, {
      type: DELETE_CLIENT_FILE,
      payload: "f1",
    } as ReduxAction);
    expect(state.selectedClientFile).toBeNull();
    expect(state.clientFiles).toHaveLength(0);
  });
});
