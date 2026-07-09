import { createReducer, on } from '@ngrx/store';
import { ClientFilesActions } from './client-files.actions';
import { initialClientFilesState } from './client-files.state';
import { ClientFile } from '../../../shared/models/client-file.model';

function replaceFile(list: ClientFile[], updated: ClientFile): ClientFile[] {
  const index = list.findIndex((file) => file._id === updated._id);
  return index >= 0
    ? list.map((file) => (file._id === updated._id ? updated : file))
    : [...list, updated];
}

export const clientFilesReducer = createReducer(
  initialClientFilesState,

  on(ClientFilesActions.loadAll, (state) => ({ ...state, isLoading: true })),
  on(ClientFilesActions.loadAllSuccess, (state, { files }) => ({
    ...state,
    clientFiles: files,
    loaded: true,
    isLoading: false,
    error: null,
  })),
  on(ClientFilesActions.loadAllFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(ClientFilesActions.loadOneSuccess, (state, { file }) => ({
    ...state,
    selectedFile: file,
    clientFiles: replaceFile(state.clientFiles, file),
  })),

  on(ClientFilesActions.createFileSuccess, (state, { file }) => ({
    ...state,
    clientFiles: [...state.clientFiles, file],
  })),

  on(ClientFilesActions.updateFileSuccess, (state, { file }) => ({
    ...state,
    clientFiles: replaceFile(state.clientFiles, file),
    selectedFile: state.selectedFile?._id === file._id ? file : state.selectedFile,
  })),

  on(ClientFilesActions.deleteFileSuccess, (state, { id }) => ({
    ...state,
    clientFiles: state.clientFiles.filter((file) => file._id !== id),
    selectedFile: state.selectedFile?._id === id ? null : state.selectedFile,
  })),

  on(ClientFilesActions.uploadDocumentSuccess, (state, { file }) => ({
    ...state,
    clientFiles: replaceFile(state.clientFiles, file),
    selectedFile: state.selectedFile?._id === file._id ? file : state.selectedFile,
  })),

  on(ClientFilesActions.deleteDocumentSuccess, (state, { file }) => ({
    ...state,
    clientFiles: replaceFile(state.clientFiles, file),
    selectedFile: state.selectedFile?._id === file._id ? file : state.selectedFile,
  })),

  on(ClientFilesActions.setSelected, (state, { file }) => ({ ...state, selectedFile: file })),
);
