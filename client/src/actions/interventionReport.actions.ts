import axios from "axios";
import type { InterventionReportForm, AppDispatch } from "../types";

export const GET_ALL_INTERVENTION_REPORTS = "GET_ALL_INTERVENTION_REPORTS";
export const GET_INTERVENTION_REPORT = "GET_INTERVENTION_REPORT";
export const SET_SELECTED_REPORT = "SET_SELECTED_REPORT";
export const CREATE_INTERVENTION_REPORT = "CREATE_INTERVENTION_REPORT";
export const UPDATE_INTERVENTION_REPORT = "UPDATE_INTERVENTION_REPORT";
export const DELETE_INTERVENTION_REPORT = "DELETE_INTERVENTION_REPORT";

const BASE = () => `${import.meta.env.VITE_API_URL}api/intervention-reports`;

export const getAllInterventionReports =
  (clientFileId?: string) => (dispatch: AppDispatch) => {
    const url = clientFileId
      ? `${BASE()}?clientFileId=${clientFileId}`
      : BASE();
    return axios
      .get(url, { withCredentials: true })
      .then((res) =>
        dispatch({ type: GET_ALL_INTERVENTION_REPORTS, payload: res.data }),
      )
      .catch((err) => console.error("getAllInterventionReports:", err));
  };

export const getInterventionReport = (id: string) => (dispatch: AppDispatch) =>
  axios
    .get(`${BASE()}/${id}`, { withCredentials: true })
    .then((res) =>
      dispatch({ type: GET_INTERVENTION_REPORT, payload: res.data }),
    )
    .catch((err) => console.error("getInterventionReport:", err));

export const setSelectedReport = (
  report: import("../types").InterventionReport | null,
) => ({
  type: SET_SELECTED_REPORT,
  payload: report,
});

export const createInterventionReport =
  (data: InterventionReportForm) => (dispatch: AppDispatch) =>
    axios
      .post(BASE(), data, { withCredentials: true })
      .then((res) => {
        dispatch(
          getAllInterventionReports() as unknown as Parameters<
            typeof dispatch
          >[0],
        );
        return res.data;
      })
      .catch((err) => {
        console.error("createInterventionReport:", err);
        throw err;
      });

export const updateInterventionReport =
  (id: string, data: Partial<InterventionReportForm>) =>
  (dispatch: AppDispatch) =>
    axios
      .put(`${BASE()}/${id}`, data, { withCredentials: true })
      .then((res) => {
        dispatch({ type: UPDATE_INTERVENTION_REPORT, payload: res.data });
        dispatch(
          getAllInterventionReports() as unknown as Parameters<
            typeof dispatch
          >[0],
        );
        return res.data;
      })
      .catch((err) => {
        console.error("updateInterventionReport:", err);
        throw err;
      });

export const deleteInterventionReport =
  (id: string) => (dispatch: AppDispatch) =>
    axios
      .delete(`${BASE()}/${id}`, { withCredentials: true })
      .then(() => {
        dispatch({ type: DELETE_INTERVENTION_REPORT, payload: id });
        dispatch(
          getAllInterventionReports() as unknown as Parameters<
            typeof dispatch
          >[0],
        );
      })
      .catch((err) => {
        console.error("deleteInterventionReport:", err);
        throw err;
      });
