import { describe, it, expect } from 'vitest';
import { shipmentsReducer } from '../shipments.reducer';
import { ShipmentsActions } from '../shipments.actions';
import { initialShipmentsState } from '../shipments.state';
import type { Shipment } from '../../../../shared/models/shipment.model';

const sampleShipment: Shipment = {
  _id: 's1',
  nom: 'Dupont',
  prenom: 'Jean',
  tel: '0600000001',
  adresse: '1 rue de la Paix',
  codePostal: '75001',
  ville: 'Paris',
  societeOuFonction: 'Gérant',
  societe: 'Bistrot du coin',
  piece: 'Écran tactile',
  sent: false,
  createdByName: 'admin',
};

const otherShipment: Shipment = {
  _id: 's2',
  nom: 'Martin',
  prenom: 'Claire',
  adresse: '5 avenue Victor Hugo',
  codePostal: '69001',
  ville: 'Lyon',
  societeOuFonction: 'Responsable',
  societe: 'Brasserie Nord',
  piece: 'Tiroir caisse',
  sent: false,
};

describe('shipmentsReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = shipmentsReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialShipmentsState);
  });

  it('should handle fetchShipments by setting isLoading to true', () => {
    const state = shipmentsReducer(
      initialShipmentsState,
      ShipmentsActions.fetchShipments({ params: { page: 1, limit: 10 } }),
    );
    expect(state.isLoading).toBe(true);
  });

  it('should handle fetchShipmentsSuccess', () => {
    const state = shipmentsReducer(
      { ...initialShipmentsState, isLoading: true },
      ShipmentsActions.fetchShipmentsSuccess({ shipments: [sampleShipment] }),
    );
    expect(state.shipments).toEqual([sampleShipment]);
    expect(state.loaded).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle fetchShipmentsFailure', () => {
    const state = shipmentsReducer(
      { ...initialShipmentsState, isLoading: true },
      ShipmentsActions.fetchShipmentsFailure({ error: 'Connexion perdue' }),
    );
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Connexion perdue');
  });

  it('should handle createShipmentSuccess by prepending to shipments', () => {
    const state = shipmentsReducer(
      { ...initialShipmentsState, shipments: [otherShipment] },
      ShipmentsActions.createShipmentSuccess({ shipment: sampleShipment }),
    );
    expect(state.shipments[0]).toEqual(sampleShipment);
    expect(state.shipments[1]).toEqual(otherShipment);
  });

  it('should handle markSentSuccess by replacing the matching shipment', () => {
    const sentShipment: Shipment = { ...sampleShipment, sent: true, sentBy: 'admin' };
    const state = shipmentsReducer(
      { ...initialShipmentsState, shipments: [sampleShipment, otherShipment] },
      ShipmentsActions.markSentSuccess({ shipment: sentShipment }),
    );
    expect(state.shipments.find((sh) => sh._id === 's1')).toEqual(sentShipment);
    expect(state.shipments.find((sh) => sh._id === 's2')).toEqual(otherShipment);
  });

  it('should handle deleteShipmentSuccess by removing the shipment', () => {
    const state = shipmentsReducer(
      { ...initialShipmentsState, shipments: [sampleShipment, otherShipment] },
      ShipmentsActions.deleteShipmentSuccess({ id: 's1' }),
    );
    expect(state.shipments).toEqual([otherShipment]);
  });

  it('should not modify other shipments on deleteShipmentSuccess', () => {
    const state = shipmentsReducer(
      { ...initialShipmentsState, shipments: [sampleShipment, otherShipment] },
      ShipmentsActions.deleteShipmentSuccess({ id: 's1' }),
    );
    expect(state.shipments).toHaveLength(1);
    expect(state.shipments[0]._id).toBe('s2');
  });
});
