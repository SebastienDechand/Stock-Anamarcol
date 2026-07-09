import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';
import { ShipmentsPage } from '../shipments-page';
import { ShipmentsFacade } from '../store/shipments.facade';
import { initialShipmentsState } from '../store/shipments.state';
import { initialClientFilesState } from '../../client-files/store/client-files.state';
import { initialAuthState } from '../../../store/auth/auth.state';
import type { Shipment } from '../../../shared/models/shipment.model';
import type { ClientFile } from '../../../shared/models/client-file.model';

const initialState = {
  shipments: initialShipmentsState,
  clientFiles: initialClientFilesState,
  auth: initialAuthState,
};

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

const sampleClientFile: ClientFile = {
  _id: 'cf1',
  nom: 'Martin',
  prenom: 'Claire',
  societe: 'Brasserie Nord',
  adresse: '5 avenue Victor Hugo',
  cp: '69001',
  ville: 'Lyon',
  tel: '0612345678',
  mobile: '0698765432',
  email: 'claire@example.com',
  visitePreinstallation: false,
  saisirFichierProduit: false,
  decoupePlanMenuiserie: false,
  decoupePlanMarbrerie: false,
  equipement: {
    nbCashguard: 0,
    nbFusion: 0,
    nbCaisses: 0,
    nbAutresMateriels: 0,
    nbBalancesCaisses: 0,
    licencesTactis: 0,
    licencesInno: 0,
    pcBackoffice: 0,
    pcCentralisation: 0,
    borneAllergene: false,
    borneCommande: false,
    etiquettesElectronique: false,
    carteFidelite: false,
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('ShipmentsPage', () => {
  let component: ShipmentsPage;
  let facade: ShipmentsFacade;

  beforeEach(async () => {
    TestBed.overrideComponent(ShipmentsPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [ShipmentsPage],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    facade = TestBed.inject(ShipmentsFacade);
    vi.spyOn(facade, 'fetch').mockImplementation(() => {});

    const fixture = TestBed.createComponent(ShipmentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('setSearch()', () => {
    it('should update the search signal', () => {
      component.setSearch('dupont');
      expect(component.search()).toBe('dupont');
    });

    it('should reset currentPage to 1', () => {
      component.currentPage.set(3);
      component.setSearch('test');
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('setStatusFilter()', () => {
    it('should update the statusFilter signal', () => {
      component.setStatusFilter('pending');
      expect(component.statusFilter()).toBe('pending');
    });

    it('should reset currentPage to 1', () => {
      component.currentPage.set(5);
      component.setStatusFilter('sent');
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('loadPage()', () => {
    it('should clamp to 1 when given a page below 1', () => {
      component.loadPage(0);
      expect(component.currentPage()).toBe(1);
    });

    it('should clamp to totalPages when given a page above totalPages', () => {
      // totalPages is at least 1 when filtered is empty
      component.loadPage(999);
      expect(component.currentPage()).toBe(component.totalPages());
    });

    it('should set the page when within valid range', () => {
      // Populate allShipments to create multiple pages (need > 20 items)
      const manyShipments: Shipment[] = Array.from({ length: 50 }, (_, i) => ({
        ...sampleShipment,
        _id: `s${i}`,
      }));
      component.allShipments.set(manyShipments);
      component.loadPage(2);
      expect(component.currentPage()).toBe(2);
    });
  });

  describe('clearClientFile()', () => {
    it('should clear linkedClientFileId', () => {
      component.linkedClientFileId.set('cf1');
      component.clearClientFile();
      expect(component.linkedClientFileId()).toBe('');
    });

    it('should clear clientFileSearch', () => {
      component.clientFileSearch.set('some search');
      component.clearClientFile();
      expect(component.clientFileSearch()).toBe('');
    });
  });

  describe('updateField()', () => {
    it('should update the specified field in the form signal', () => {
      component.updateField('nom', 'Leclerc');
      expect(component.form().nom).toBe('Leclerc');
    });

    it('should not affect other form fields', () => {
      component.form.set({ ...component.form(), piece: 'Clavier', nom: 'Initial' });
      component.updateField('nom', 'Nouveau');
      expect(component.form().piece).toBe('Clavier');
    });
  });

  describe('submitCreate()', () => {
    it('should NOT call facade.create when nom is empty', () => {
      vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.form.set({ ...component.form(), nom: '', piece: 'Écran' });
      component.submitCreate();
      expect(facade.create).not.toHaveBeenCalled();
    });

    it('should NOT call facade.create when piece is empty', () => {
      vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.form.set({ ...component.form(), nom: 'Dupont', piece: '' });
      component.submitCreate();
      expect(facade.create).not.toHaveBeenCalled();
    });

    it('should NOT call facade.create when both nom and piece are whitespace', () => {
      vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.form.set({ ...component.form(), nom: '   ', piece: '   ' });
      component.submitCreate();
      expect(facade.create).not.toHaveBeenCalled();
    });

    it('should call facade.create with form data and currentUserName when nom and piece are filled', () => {
      const createSpy = vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.currentUserName.set('admin');
      const formData = { ...component.form(), nom: 'Dupont', piece: 'Écran' };
      component.form.set(formData);
      component.submitCreate();
      expect(createSpy).toHaveBeenCalledWith(formData, 'admin');
    });

    it('should include the linked client file id as clientFile when one is selected', () => {
      const createSpy = vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.currentUserName.set('admin');
      component.linkedClientFileId.set('cf1');
      const formData = { ...component.form(), nom: 'Dupont', piece: 'Écran' };
      component.form.set(formData);
      component.submitCreate();
      expect(createSpy).toHaveBeenCalledWith({ ...formData, clientFile: 'cf1' }, 'admin');
    });

    it('should reset form to empty after successful submit', () => {
      vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.form.set({ ...component.form(), nom: 'Dupont', piece: 'Écran', ville: 'Paris' });
      component.submitCreate();
      expect(component.form().nom).toBe('');
      expect(component.form().piece).toBe('');
      expect(component.form().ville).toBe('');
    });

    it('should clear linkedClientFileId and hide form after successful submit', () => {
      vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.linkedClientFileId.set('cf1');
      component.showForm.set(true);
      component.form.set({ ...component.form(), nom: 'Dupont', piece: 'Écran' });
      component.submitCreate();
      expect(component.linkedClientFileId()).toBe('');
      expect(component.showForm()).toBe(false);
    });
  });

  describe('onMarkSent()', () => {
    it('should call facade.markSent with shipment._id and currentUserName', () => {
      const markSentSpy = vi.spyOn(facade, 'markSent').mockImplementation(() => {});
      component.currentUserName.set('operateur');
      component.onMarkSent(sampleShipment);
      expect(markSentSpy).toHaveBeenCalledWith('s1', 'operateur');
    });
  });

  describe('onDeleteConfirm()', () => {
    it('should set deletingShipment to the given shipment', () => {
      expect(component.deletingShipment()).toBeNull();
      component.onDeleteConfirm(sampleShipment);
      expect(component.deletingShipment()).toEqual(sampleShipment);
    });
  });

  describe('confirmDelete()', () => {
    it('should call facade.delete with shipment._id when deletingShipment is set', () => {
      const deleteSpy = vi.spyOn(facade, 'delete').mockImplementation(() => {});
      component.deletingShipment.set(sampleShipment);
      component.confirmDelete();
      expect(deleteSpy).toHaveBeenCalledWith('s1');
    });

    it('should clear deletingShipment after calling facade.delete', () => {
      vi.spyOn(facade, 'delete').mockImplementation(() => {});
      component.deletingShipment.set(sampleShipment);
      component.confirmDelete();
      expect(component.deletingShipment()).toBeNull();
    });

    it('should NOT call facade.delete when deletingShipment is null', () => {
      const deleteSpy = vi.spyOn(facade, 'delete').mockImplementation(() => {});
      component.deletingShipment.set(null);
      component.confirmDelete();
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should still clear deletingShipment when it is null', () => {
      vi.spyOn(facade, 'delete').mockImplementation(() => {});
      component.deletingShipment.set(null);
      component.confirmDelete();
      expect(component.deletingShipment()).toBeNull();
    });
  });

  describe('openHistory()', () => {
    it('should set showHistory to true', () => {
      expect(component.showHistory()).toBe(false);
      component.openHistory();
      expect(component.showHistory()).toBe(true);
    });
  });

  describe('onArchived()', () => {
    it('should call facade.fetch to refresh the shipments list', () => {
      const fetchSpy = vi.spyOn(facade, 'fetch').mockImplementation(() => {});
      component.onArchived();
      expect(fetchSpy).toHaveBeenCalledWith({ page: 1, limit: 200 });
    });
  });

  describe('formatDate()', () => {
    it('should return "-" for undefined input', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return "-" for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should return a localized French date string for a valid ISO date', () => {
      const result = component.formatDate('2024-06-15T10:30:00.000Z');
      expect(result).toBeTruthy();
      expect(result).not.toBe('-');
      // Verify it is a non-empty string produced by toLocaleString('fr-FR')
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('clientFileLabel()', () => {
    it('should return uppercase nom when prenom and societe are absent', () => {
      const cf = { ...sampleClientFile, prenom: undefined, societe: undefined };
      expect(component.clientFileLabel(cf)).toBe('MARTIN');
    });

    it('should include prenom when present', () => {
      const cf = { ...sampleClientFile, prenom: 'Claire', societe: undefined };
      expect(component.clientFileLabel(cf)).toBe('MARTIN Claire');
    });

    it('should include societe with separator when present', () => {
      const cf = { ...sampleClientFile, prenom: undefined, societe: 'Brasserie Nord' };
      expect(component.clientFileLabel(cf)).toBe('MARTIN - Brasserie Nord');
    });

    it('should include both prenom and societe when both present', () => {
      const cf = { ...sampleClientFile, prenom: 'Claire', societe: 'Brasserie Nord' };
      expect(component.clientFileLabel(cf)).toBe('MARTIN Claire - Brasserie Nord');
    });
  });
});
