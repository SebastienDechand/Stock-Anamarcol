import { ClientFile } from '../../../../shared/models/client-file/client-file.model';

export interface ClientFilesState {
  clientFiles: ClientFile[];
  selectedFile: ClientFile | null;
  loaded: boolean;
  isLoading: boolean;
  error: string | null;
}

export const initialClientFilesState: ClientFilesState = {
  clientFiles: [],
  selectedFile: null,
  loaded: false,
  isLoading: false,
  error: null,
};
