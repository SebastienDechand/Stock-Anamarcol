import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import {
  ClientFile,
  ClientFileForm,
} from '../../../../shared/models/client-file/client-file.model';
import { ClientFilesActions } from '../actions/client-files.actions';
import {
  selectAllClientFiles,
  selectClientFilesLoaded,
  selectClientFilesLoading,
  selectSelectedFile,
} from '../selectors/client-files.selectors';

@Injectable({ providedIn: 'root' })
export class ClientFilesFacade {
  private store = inject(Store);

  clientFiles$ = this.store.select(selectAllClientFiles);
  selectedFile$ = this.store.select(selectSelectedFile);
  isLoading$ = combineLatest([
    this.store.select(selectClientFilesLoading),
    this.store.select(selectClientFilesLoaded),
  ]).pipe(map(([loading, loaded]) => loading && !loaded));

  loadAll() {
    this.store.dispatch(ClientFilesActions.loadAll());
  }
  loadOne(id: string) {
    this.store.dispatch(ClientFilesActions.loadOne({ id }));
  }
  create(data: Partial<ClientFileForm>) {
    this.store.dispatch(ClientFilesActions.createFile({ data }));
  }
  update(id: string, data: Partial<ClientFileForm>) {
    this.store.dispatch(ClientFilesActions.updateFile({ id, data }));
  }
  delete(id: string) {
    this.store.dispatch(ClientFilesActions.deleteFile({ id }));
  }
  uploadDocument(id: string, formData: FormData) {
    this.store.dispatch(ClientFilesActions.uploadDocument({ id, formData }));
  }
  deleteDocument(fileId: string, docId: string) {
    this.store.dispatch(ClientFilesActions.deleteDocument({ fileId, docId }));
  }
  setSelected(file: ClientFile | null) {
    this.store.dispatch(ClientFilesActions.setSelected({ file }));
  }
}
