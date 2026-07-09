import { describe, it, expect } from 'vitest';
import {
  selectShipments,
  selectShipmentsLoading,
  selectShipmentsLoaded,
} from '../shipments.selectors';
import { initialShipmentsState } from '../shipments.state';
import type { Shipment } from '../../../../shared/models/shipment.model';

const sampleShipment: Shipment = {
  _id: 'ship-1',
  nom: 'Dupont',
  prenom: 'Jean',
  adresse: '1 rue de la Paix',
  codePostal: '75001',
  ville: 'Paris',
  societeOuFonction: 'Gérant',
  societe: 'ACME',
  piece: 'Clavier modèle X',
  sent: false,
};

const sampleShipment2: Shipment = {
  _id: 'ship-2',
  nom: 'Martin',
  prenom: 'Sophie',
  adresse: '5 avenue de Lyon',
  codePostal: '69001',
  ville: 'Lyon',
  societeOuFonction: 'Directrice',
  societe: 'BETA',
  piece: 'Écran 24"',
  sent: true,
};

describe('Shipments Selectors', () => {
  describe('selectShipments', () => {
    it('should return empty array from initial state', () => {
      const state = { shipments: initialShipmentsState };
      expect(selectShipments(state)).toEqual([]);
    });

    it('should return shipments when populated', () => {
      const state = {
        shipments: { ...initialShipmentsState, shipments: [sampleShipment, sampleShipment2] },
      };
      expect(selectShipments(state)).toEqual([sampleShipment, sampleShipment2]);
    });
  });

  describe('selectShipmentsLoading', () => {
    it('should return false from initial state', () => {
      const state = { shipments: initialShipmentsState };
      expect(selectShipmentsLoading(state)).toBe(false);
    });

    it('should return true when loading', () => {
      const state = { shipments: { ...initialShipmentsState, isLoading: true } };
      expect(selectShipmentsLoading(state)).toBe(true);
    });
  });

  describe('selectShipmentsLoaded', () => {
    it('should return false from initial state', () => {
      const state = { shipments: initialShipmentsState };
      expect(selectShipmentsLoaded(state)).toBe(false);
    });

    it('should return true when loaded', () => {
      const state = { shipments: { ...initialShipmentsState, loaded: true } };
      expect(selectShipmentsLoaded(state)).toBe(true);
    });
  });
});
