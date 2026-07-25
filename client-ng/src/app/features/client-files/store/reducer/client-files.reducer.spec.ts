import { describe, it, expect } from 'vitest';
import { clientFilesReducer } from './client-files.reducer';
import { ClientFilesActions } from '../actions/client-files.actions';
import { initialClientFilesState } from '../state/client-files.state';
import type { ClientFile } from '../../../../shared/models/client-file/client-file.model';

const baseEquipement = {
  cashguardCount: 1,
  fusionCount: 0,
  registerCount: 2,
  otherEquipmentCount: 0,
  scaleCount: 0,
  tactisLicenses: 1,
  innoLicenses: 0,
  backofficePcCount: 1,
  centralizationPcCount: 0,
  allergenKiosk: false,
  orderKiosk: false,
  electronicLabels: false,
  loyaltyCard: false,
};

const sampleFile: ClientFile = {
  _id: 'f1',
  lastName: 'Dupont',
  firstName: 'Jean',
  company: 'Bistrot du coin',
  city: 'Paris',
  postalCode: '75001',
  preInstallationVisit: false,
  productFileEntry: false,
  carpentryPlanCutout: false,
  stoneworkPlanCutout: false,
  equipment: baseEquipement,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const otherFile: ClientFile = {
  _id: 'f2',
  lastName: 'Martin',
  firstName: 'Claire',
  company: 'Brasserie Nord',
  city: 'Lyon',
  postalCode: '69001',
  preInstallationVisit: true,
  productFileEntry: false,
  carpentryPlanCutout: false,
  stoneworkPlanCutout: false,
  equipment: { ...baseEquipement, cashguardCount: 2 },
  createdAt: '2024-02-01T00:00:00Z',
  updatedAt: '2024-02-01T00:00:00Z',
};

describe('clientFilesReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = clientFilesReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialClientFilesState);
  });

  it('should handle loadAll by setting isLoading to true', () => {
    const state = clientFilesReducer(initialClientFilesState, ClientFilesActions.loadAll());
    expect(state.isLoading).toBe(true);
  });

  it('should handle loadAllSuccess', () => {
    const state = clientFilesReducer(
      { ...initialClientFilesState, isLoading: true },
      ClientFilesActions.loadAllSuccess({ files: [sampleFile, otherFile] }),
    );
    expect(state.clientFiles).toEqual([sampleFile, otherFile]);
    expect(state.loaded).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle loadAllFailure', () => {
    const state = clientFilesReducer(
      { ...initialClientFilesState, isLoading: true },
      ClientFilesActions.loadAllFailure({ error: 'Erreur serveur' }),
    );
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Erreur serveur');
  });

  it('should handle loadOneSuccess by setting selectedFile and updating list if present', () => {
    const updated: ClientFile = { ...sampleFile, city: 'Bordeaux' };
    const state = clientFilesReducer(
      { ...initialClientFilesState, clientFiles: [sampleFile, otherFile] },
      ClientFilesActions.loadOneSuccess({ file: updated }),
    );
    expect(state.selectedFile).toEqual(updated);
    expect(state.clientFiles.find((f) => f._id === 'f1')).toEqual(updated);
  });

  it('should handle loadOneSuccess by appending to list if not present', () => {
    const state = clientFilesReducer(
      { ...initialClientFilesState, clientFiles: [otherFile] },
      ClientFilesActions.loadOneSuccess({ file: sampleFile }),
    );
    expect(state.clientFiles).toHaveLength(2);
    expect(state.clientFiles).toContain(sampleFile);
  });

  it('should handle createFileSuccess by appending to clientFiles', () => {
    const state = clientFilesReducer(
      { ...initialClientFilesState, clientFiles: [otherFile] },
      ClientFilesActions.createFileSuccess({ file: sampleFile }),
    );
    expect(state.clientFiles).toEqual([otherFile, sampleFile]);
  });

  it('should handle updateFileSuccess by replacing file in list', () => {
    const updated: ClientFile = { ...sampleFile, city: 'Marseille' };
    const state = clientFilesReducer(
      { ...initialClientFilesState, clientFiles: [sampleFile, otherFile] },
      ClientFilesActions.updateFileSuccess({ file: updated }),
    );
    expect(state.clientFiles.find((f) => f._id === 'f1')).toEqual(updated);
    expect(state.clientFiles.find((f) => f._id === 'f2')).toEqual(otherFile);
  });

  it('should handle updateFileSuccess by updating selectedFile when it matches', () => {
    const updated: ClientFile = { ...sampleFile, city: 'Marseille' };
    const state = clientFilesReducer(
      {
        ...initialClientFilesState,
        clientFiles: [sampleFile],
        selectedFile: sampleFile,
      },
      ClientFilesActions.updateFileSuccess({ file: updated }),
    );
    expect(state.selectedFile).toEqual(updated);
  });

  it('should handle updateFileSuccess without changing selectedFile when it does not match', () => {
    const updated: ClientFile = { ...sampleFile, city: 'Marseille' };
    const state = clientFilesReducer(
      {
        ...initialClientFilesState,
        clientFiles: [sampleFile, otherFile],
        selectedFile: otherFile,
      },
      ClientFilesActions.updateFileSuccess({ file: updated }),
    );
    expect(state.selectedFile).toEqual(otherFile);
  });

  it('should handle deleteFileSuccess by removing the file from the list', () => {
    const state = clientFilesReducer(
      { ...initialClientFilesState, clientFiles: [sampleFile, otherFile] },
      ClientFilesActions.deleteFileSuccess({ id: 'f1' }),
    );
    expect(state.clientFiles).toEqual([otherFile]);
  });

  it('should handle deleteFileSuccess by clearing selectedFile when it matches', () => {
    const state = clientFilesReducer(
      {
        ...initialClientFilesState,
        clientFiles: [sampleFile, otherFile],
        selectedFile: sampleFile,
      },
      ClientFilesActions.deleteFileSuccess({ id: 'f1' }),
    );
    expect(state.selectedFile).toBeNull();
  });

  it('should handle deleteFileSuccess without clearing selectedFile when it does not match', () => {
    const state = clientFilesReducer(
      {
        ...initialClientFilesState,
        clientFiles: [sampleFile, otherFile],
        selectedFile: otherFile,
      },
      ClientFilesActions.deleteFileSuccess({ id: 'f1' }),
    );
    expect(state.selectedFile).toEqual(otherFile);
  });

  it('should handle uploadDocumentSuccess by replacing file in list and updating selectedFile', () => {
    const withDoc: ClientFile = {
      ...sampleFile,
      documents: [
        {
          _id: 'd1',
          name: 'BDC 2024',
          filename: 'bdc_2024.pdf',
          type: 'purchase_order',
          uploadedAt: '2024-03-01T00:00:00Z',
        },
      ],
    };
    const state = clientFilesReducer(
      {
        ...initialClientFilesState,
        clientFiles: [sampleFile, otherFile],
        selectedFile: sampleFile,
      },
      ClientFilesActions.uploadDocumentSuccess({ file: withDoc }),
    );
    expect(state.clientFiles.find((f) => f._id === 'f1')).toEqual(withDoc);
    expect(state.selectedFile).toEqual(withDoc);
  });

  it('should handle deleteDocumentSuccess by replacing file in list', () => {
    const withDoc: ClientFile = { ...sampleFile, documents: [] };
    const state = clientFilesReducer(
      { ...initialClientFilesState, clientFiles: [sampleFile, otherFile] },
      ClientFilesActions.deleteDocumentSuccess({ file: withDoc }),
    );
    expect(state.clientFiles.find((f) => f._id === 'f1')).toEqual(withDoc);
  });

  it('should handle setSelected by updating selectedFile', () => {
    const state = clientFilesReducer(
      initialClientFilesState,
      ClientFilesActions.setSelected({ file: sampleFile }),
    );
    expect(state.selectedFile).toEqual(sampleFile);
  });

  it('should handle setSelected with null by clearing selectedFile', () => {
    const state = clientFilesReducer(
      { ...initialClientFilesState, selectedFile: sampleFile },
      ClientFilesActions.setSelected({ file: null }),
    );
    expect(state.selectedFile).toBeNull();
  });
});
