import { describe, it, expect } from 'vitest';
import {
  selectAllClientFiles,
  selectSelectedFile,
  selectClientFilesLoading,
  selectClientFilesLoaded,
} from '../client-files.selectors';
import { initialClientFilesState } from '../client-files.state';
import type { ClientFile } from '../../../../shared/models/client-file.model';

const sampleEquipement = {
  cashguardCount: 1,
  fusionCount: 0,
  registerCount: 2,
  otherEquipmentCount: 0,
  scaleCount: 1,
  tactisLicenses: 2,
  innoLicenses: 0,
  backofficePcCount: 1,
  centralizationPcCount: 1,
  allergenKiosk: false,
  orderKiosk: false,
  electronicLabels: false,
  loyaltyCard: true,
};

const sampleClientFile: ClientFile = {
  _id: 'cf-1',
  lastName: 'Durand',
  firstName: 'Pierre',
  company: 'Supermarché Durand',
  address: '12 rue du Commerce',
  postalCode: '33000',
  city: 'Bordeaux',
  preInstallationVisit: false,
  productFileEntry: false,
  carpentryPlanCutout: false,
  stoneworkPlanCutout: false,
  equipment: sampleEquipement,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-06-01T08:00:00Z',
};

const sampleClientFile2: ClientFile = {
  _id: 'cf-2',
  lastName: 'Lefebvre',
  company: 'Boulangerie Lefebvre',
  preInstallationVisit: true,
  productFileEntry: true,
  carpentryPlanCutout: false,
  stoneworkPlanCutout: false,
  equipment: { ...sampleEquipement, registerCount: 1 },
  createdAt: '2024-03-10T09:00:00Z',
  updatedAt: '2024-05-20T14:00:00Z',
};

describe('Client Files Selectors', () => {
  describe('selectAllClientFiles', () => {
    it('should return empty array from initial state', () => {
      const state = { clientFiles: initialClientFilesState };
      expect(selectAllClientFiles(state)).toEqual([]);
    });

    it('should return client files when populated', () => {
      const state = {
        clientFiles: {
          ...initialClientFilesState,
          clientFiles: [sampleClientFile, sampleClientFile2],
        },
      };
      expect(selectAllClientFiles(state)).toEqual([sampleClientFile, sampleClientFile2]);
    });
  });

  describe('selectSelectedFile', () => {
    it('should return null from initial state', () => {
      const state = { clientFiles: initialClientFilesState };
      expect(selectSelectedFile(state)).toBeNull();
    });

    it('should return the selected client file when set', () => {
      const state = {
        clientFiles: { ...initialClientFilesState, selectedFile: sampleClientFile },
      };
      expect(selectSelectedFile(state)).toEqual(sampleClientFile);
    });
  });

  describe('selectClientFilesLoading', () => {
    it('should return false from initial state', () => {
      const state = { clientFiles: initialClientFilesState };
      expect(selectClientFilesLoading(state)).toBe(false);
    });

    it('should return true when loading', () => {
      const state = { clientFiles: { ...initialClientFilesState, isLoading: true } };
      expect(selectClientFilesLoading(state)).toBe(true);
    });
  });

  describe('selectClientFilesLoaded', () => {
    it('should return false from initial state', () => {
      const state = { clientFiles: initialClientFilesState };
      expect(selectClientFilesLoaded(state)).toBe(false);
    });

    it('should return true when loaded', () => {
      const state = { clientFiles: { ...initialClientFilesState, loaded: true } };
      expect(selectClientFilesLoaded(state)).toBe(true);
    });
  });
});
