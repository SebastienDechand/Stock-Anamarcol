import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ClientFilesState } from './client-files.state';

export const selectClientFilesState = createFeatureSelector<ClientFilesState>('clientFiles');

export const selectAllClientFiles = createSelector(
  selectClientFilesState,
  (state) => state.clientFiles,
);
export const selectSelectedFile = createSelector(
  selectClientFilesState,
  (state) => state.selectedFile,
);
export const selectClientFilesLoading = createSelector(
  selectClientFilesState,
  (state) => state.isLoading,
);
export const selectClientFilesLoaded = createSelector(
  selectClientFilesState,
  (state) => state.loaded,
);
