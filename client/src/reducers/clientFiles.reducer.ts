import {
  GET_ALL_CLIENT_FILES,
  GET_CLIENT_FILE,
  SET_SELECTED_CLIENT_FILE,
  UPDATE_CLIENT_FILE,
  DELETE_CLIENT_FILE,
} from "../actions/clientFile.actions";
import type { ClientFilesState, ReduxAction, ClientFile } from "../types";

const initialState: ClientFilesState = {
  clientFiles: [],
  selectedClientFile: null,
  isLoading: false,
};

export default function clientFilesReducer(
  state = initialState,
  action: ReduxAction,
): ClientFilesState {
  switch (action.type) {
    case GET_ALL_CLIENT_FILES:
      return {
        ...state,
        clientFiles: action.payload as ClientFile[],
        isLoading: false,
      };

    case GET_CLIENT_FILE:
      return { ...state, selectedClientFile: action.payload as ClientFile };

    case SET_SELECTED_CLIENT_FILE:
      return {
        ...state,
        selectedClientFile: action.payload as ClientFile | null,
      };

    case UPDATE_CLIENT_FILE: {
      const updated = action.payload as ClientFile;
      return {
        ...state,
        clientFiles: state.clientFiles.map((f) =>
          f._id === updated._id ? updated : f,
        ),
        selectedClientFile:
          state.selectedClientFile?._id === updated._id
            ? updated
            : state.selectedClientFile,
      };
    }

    case DELETE_CLIENT_FILE:
      return {
        ...state,
        clientFiles: state.clientFiles.filter(
          (f) => f._id !== (action.payload as string),
        ),
        selectedClientFile: null,
      };

    default:
      return state;
  }
}
