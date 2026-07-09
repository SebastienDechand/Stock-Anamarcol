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
  nbCashguard: 1,
  nbFusion: 0,
  nbCaisses: 2,
  nbAutresMateriels: 0,
  nbBalancesCaisses: 1,
  licencesTactis: 2,
  licencesInno: 0,
  pcBackoffice: 1,
  pcCentralisation: 1,
  borneAllergene: false,
  borneCommande: false,
  etiquettesElectronique: false,
  carteFidelite: true,
};

const sampleClientFile: ClientFile = {
  _id: 'cf-1',
  nom: 'Durand',
  prenom: 'Pierre',
  societe: 'Supermarché Durand',
  adresse: '12 rue du Commerce',
  cp: '33000',
  ville: 'Bordeaux',
  visitePreinstallation: false,
  saisirFichierProduit: false,
  decoupePlanMenuiserie: false,
  decoupePlanMarbrerie: false,
  equipement: sampleEquipement,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-06-01T08:00:00Z',
};

const sampleClientFile2: ClientFile = {
  _id: 'cf-2',
  nom: 'Lefebvre',
  societe: 'Boulangerie Lefebvre',
  visitePreinstallation: true,
  saisirFichierProduit: true,
  decoupePlanMenuiserie: false,
  decoupePlanMarbrerie: false,
  equipement: { ...sampleEquipement, nbCaisses: 1 },
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
