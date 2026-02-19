import { describe, it, expect } from "vitest";
import interventionReportsReducer from "../interventionReports.reducer";
import type {
  InterventionReport,
  InterventionReportsState,
  ReduxAction,
} from "../../types";

const GET_ALL_INTERVENTION_REPORTS = "GET_ALL_INTERVENTION_REPORTS";
const GET_INTERVENTION_REPORT = "GET_INTERVENTION_REPORT";
const SET_SELECTED_REPORT = "SET_SELECTED_REPORT";
const UPDATE_INTERVENTION_REPORT = "UPDATE_INTERVENTION_REPORT";
const DELETE_INTERVENTION_REPORT = "DELETE_INTERVENTION_REPORT";

const makeReport = (
  overrides: Partial<InterventionReport> = {},
): InterventionReport => ({
  _id: "report1",
  clientFile: "clientFile1",
  twCaisses: ["TW123"],
  twPc: "TWPC456",
  cashguardUnits: [
    {
      nSerie: "SN001",
      up: "UP1",
      ub: "UB1",
      k7Slots: ["", "", "", ""],
      assignedCaisses: [],
      hasPc: false,
    },
  ],
  notes: "Test notes",
  createdBy: "monteur1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("interventionReportsReducer", () => {
  const initialState: InterventionReportsState = {
    reports: [],
    selectedReport: null,
    isLoading: false,
  };

  // ─── Initial state ────────────────────────────────────────
  it("should return the initial state", () => {
    const state = interventionReportsReducer(undefined, {
      type: "@@INIT",
    } as ReduxAction);
    expect(state).toEqual(initialState);
  });

  it("should not modify state for an unknown action", () => {
    const state = interventionReportsReducer(initialState, {
      type: "UNKNOWN",
    } as ReduxAction);
    expect(state).toEqual(initialState);
  });

  // ─── GET_ALL_INTERVENTION_REPORTS ─────────────────────────
  it("should handle GET_ALL_INTERVENTION_REPORTS and set reports", () => {
    const reports = [makeReport({ _id: "r1" }), makeReport({ _id: "r2" })];
    const state = interventionReportsReducer(initialState, {
      type: GET_ALL_INTERVENTION_REPORTS,
      payload: reports,
    } as ReduxAction);
    expect(state.reports).toEqual(reports);
    expect(state.reports).toHaveLength(2);
    expect(state.isLoading).toBe(false);
  });

  it("should replace existing reports on GET_ALL_INTERVENTION_REPORTS", () => {
    const existing: InterventionReportsState = {
      ...initialState,
      reports: [makeReport({ _id: "old" })],
    };
    const newReports = [
      makeReport({ _id: "new1" }),
      makeReport({ _id: "new2" }),
    ];
    const state = interventionReportsReducer(existing, {
      type: GET_ALL_INTERVENTION_REPORTS,
      payload: newReports,
    } as ReduxAction);
    expect(state.reports).toHaveLength(2);
    expect(state.reports[0]._id).toBe("new1");
  });

  // ─── GET_INTERVENTION_REPORT ──────────────────────────────
  it("should handle GET_INTERVENTION_REPORT and set selectedReport", () => {
    const report = makeReport({ _id: "r1" });
    const state = interventionReportsReducer(initialState, {
      type: GET_INTERVENTION_REPORT,
      payload: report,
    } as ReduxAction);
    expect(state.selectedReport).toEqual(report);
    expect(state.reports).toEqual([]); // unchanged
  });

  // ─── SET_SELECTED_REPORT ──────────────────────────────────
  it("should handle SET_SELECTED_REPORT with a report", () => {
    const report = makeReport({ _id: "r2" });
    const state = interventionReportsReducer(initialState, {
      type: SET_SELECTED_REPORT,
      payload: report,
    } as ReduxAction);
    expect(state.selectedReport).toEqual(report);
  });

  it("should handle SET_SELECTED_REPORT with null", () => {
    const current: InterventionReportsState = {
      ...initialState,
      selectedReport: makeReport(),
    };
    const state = interventionReportsReducer(current, {
      type: SET_SELECTED_REPORT,
      payload: null,
    } as ReduxAction);
    expect(state.selectedReport).toBeNull();
  });

  // ─── UPDATE_INTERVENTION_REPORT ───────────────────────────
  it("should handle UPDATE_INTERVENTION_REPORT and replace the matching report", () => {
    const original = makeReport({ _id: "r1", notes: "old note" });
    const other = makeReport({ _id: "r2", notes: "other note" });
    const current: InterventionReportsState = {
      ...initialState,
      reports: [original, other],
    };
    const updated = makeReport({ _id: "r1", notes: "new note" });
    const state = interventionReportsReducer(current, {
      type: UPDATE_INTERVENTION_REPORT,
      payload: updated,
    } as ReduxAction);
    expect(state.reports[0].notes).toBe("new note");
    expect(state.reports[1].notes).toBe("other note"); // unchanged
  });

  it("should update selectedReport if it matches the updated report", () => {
    const report = makeReport({ _id: "r1", notes: "old" });
    const current: InterventionReportsState = {
      ...initialState,
      reports: [report],
      selectedReport: report,
    };
    const updated = makeReport({ _id: "r1", notes: "updated" });
    const state = interventionReportsReducer(current, {
      type: UPDATE_INTERVENTION_REPORT,
      payload: updated,
    } as ReduxAction);
    expect(state.selectedReport?.notes).toBe("updated");
  });

  it("should NOT update selectedReport if it does not match", () => {
    const reportA = makeReport({ _id: "r1" });
    const reportB = makeReport({ _id: "r2", notes: "selected" });
    const current: InterventionReportsState = {
      ...initialState,
      reports: [reportA, reportB],
      selectedReport: reportB,
    };
    const updated = makeReport({ _id: "r1", notes: "updated" });
    const state = interventionReportsReducer(current, {
      type: UPDATE_INTERVENTION_REPORT,
      payload: updated,
    } as ReduxAction);
    expect(state.selectedReport?.notes).toBe("selected");
  });

  // ─── DELETE_INTERVENTION_REPORT ───────────────────────────
  it("should handle DELETE_INTERVENTION_REPORT and remove the report", () => {
    const reports = [makeReport({ _id: "r1" }), makeReport({ _id: "r2" })];
    const current: InterventionReportsState = {
      ...initialState,
      reports,
    };
    const state = interventionReportsReducer(current, {
      type: DELETE_INTERVENTION_REPORT,
      payload: "r1",
    } as ReduxAction);
    expect(state.reports).toHaveLength(1);
    expect(state.reports[0]._id).toBe("r2");
  });

  it("should set selectedReport to null on DELETE_INTERVENTION_REPORT", () => {
    const report = makeReport({ _id: "r1" });
    const current: InterventionReportsState = {
      ...initialState,
      reports: [report],
      selectedReport: report,
    };
    const state = interventionReportsReducer(current, {
      type: DELETE_INTERVENTION_REPORT,
      payload: "r1",
    } as ReduxAction);
    expect(state.selectedReport).toBeNull();
    expect(state.reports).toHaveLength(0);
  });

  // ─── Populated clientFile reference ───────────────────────
  it("should handle reports where clientFile is a populated object", () => {
    const report = makeReport({
      _id: "r1",
      clientFile: {
        _id: "cf1",
        nom: "DUPONT",
        societe: "TestCorp",
      },
    });
    const state = interventionReportsReducer(initialState, {
      type: GET_ALL_INTERVENTION_REPORTS,
      payload: [report],
    } as ReduxAction);
    const stored = state.reports[0];
    expect(typeof stored.clientFile).toBe("object");
    expect((stored.clientFile as { nom: string }).nom).toBe("DUPONT");
  });
});
