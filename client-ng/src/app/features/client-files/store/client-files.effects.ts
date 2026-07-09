import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { ToastService } from '../../../core/toast/toast.service';
import { ClientFile } from '../../../shared/models/client-file.model';
import { ClientFilesActions } from './client-files.actions';

@Injectable()
export class ClientFilesEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loadAll$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClientFilesActions.loadAll),
      exhaustMap(() =>
        this.api.get<ClientFile[]>('api/client-files').pipe(
          map((files) => ClientFilesActions.loadAllSuccess({ files })),
          catchError((err) =>
            of(ClientFilesActions.loadAllFailure({ error: err?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  loadOne$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClientFilesActions.loadOne),
      switchMap(({ id }) =>
        this.api.get<ClientFile>(`api/client-files/${id}`).pipe(
          map((file) => ClientFilesActions.loadOneSuccess({ file })),
          catchError((err) =>
            of(ClientFilesActions.loadOneFailure({ error: err?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClientFilesActions.createFile),
      exhaustMap(({ data }) =>
        this.api.post<ClientFile>('api/client-files', data).pipe(
          map((file) => {
            this.toast.success('TOAST.CLIENT_FILE_CREATED');
            return ClientFilesActions.createFileSuccess({ file });
          }),
          catchError((err) => {
            this.toast.error('TOAST.CLIENT_FILE_CREATE_ERROR');
            return of(ClientFilesActions.createFileFailure({ error: err?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClientFilesActions.updateFile),
      exhaustMap(({ id, data }) =>
        this.api.put<ClientFile>(`api/client-files/${id}`, data).pipe(
          map((file) => {
            this.toast.success('TOAST.CLIENT_FILE_UPDATED');
            return ClientFilesActions.updateFileSuccess({ file });
          }),
          catchError((err) => {
            this.toast.error('TOAST.CLIENT_FILE_UPDATE_ERROR');
            return of(ClientFilesActions.updateFileFailure({ error: err?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClientFilesActions.deleteFile),
      exhaustMap(({ id }) =>
        this.api.delete<void>(`api/client-files/${id}`).pipe(
          map(() => {
            this.toast.success('TOAST.CLIENT_FILE_DELETED');
            return ClientFilesActions.deleteFileSuccess({ id });
          }),
          catchError((err) => {
            this.toast.error('TOAST.CLIENT_FILE_DELETE_ERROR');
            return of(ClientFilesActions.deleteFileFailure({ error: err?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  uploadDoc$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClientFilesActions.uploadDocument),
      exhaustMap(({ id, formData }) =>
        this.api.postFormData<ClientFile>(`api/client-files/${id}/documents`, formData).pipe(
          map((file) => {
            this.toast.success('TOAST.DOC_ADDED');
            return ClientFilesActions.uploadDocumentSuccess({ file });
          }),
          catchError((err) => {
            this.toast.error('TOAST.DOC_UPLOAD_ERROR');
            return of(
              ClientFilesActions.uploadDocumentFailure({ error: err?.message ?? 'Erreur' }),
            );
          }),
        ),
      ),
    ),
  );

  deleteDoc$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClientFilesActions.deleteDocument),
      exhaustMap(({ fileId, docId }) =>
        this.api.delete<ClientFile>(`api/client-files/${fileId}/documents/${docId}`).pipe(
          map((file) => {
            this.toast.success('TOAST.DOC_DELETED');
            return ClientFilesActions.deleteDocumentSuccess({ file });
          }),
          catchError((err) => {
            this.toast.error('TOAST.DOC_DELETE_ERROR');
            return of(
              ClientFilesActions.deleteDocumentFailure({ error: err?.message ?? 'Erreur' }),
            );
          }),
        ),
      ),
    ),
  );
}
