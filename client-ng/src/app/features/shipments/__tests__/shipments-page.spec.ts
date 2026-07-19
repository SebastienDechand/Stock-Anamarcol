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
  lastName: 'Dupont',
  firstName: 'Jean',
  phone: '0600000001',
  address: '1 rue de la Paix',
  postalCode: '75001',
  city: 'Paris',
  companyOrRole: 'Gérant',
  company: 'Bistrot du coin',
  part: 'Écran tactile',
  sent: false,
  createdByName: 'admin',
};

const sampleClientFile: ClientFile = {
  _id: 'cf1',
  lastName: 'Martin',
  firstName: 'Claire',
  company: 'Brasserie Nord',
  address: '5 avenue Victor Hugo',
  postalCode: '69001',
  city: 'Lyon',
  phone: '0612345678',
  mobile: '0698765432',
  email: 'claire@example.com',
  preInstallationVisit: false,
  productFileEntry: false,
  carpentryPlanCutout: false,
  stoneworkPlanCutout: false,
  equipment: {
    cashguardCount: 0,
    fusionCount: 0,
    registerCount: 0,
    otherEquipmentCount: 0,
    scaleCount: 0,
    tactisLicenses: 0,
    innoLicenses: 0,
    backofficePcCount: 0,
    centralizationPcCount: 0,
    allergenKiosk: false,
    orderKiosk: false,
    electronicLabels: false,
    loyaltyCard: false,
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
      component.updateField('lastName', 'Leclerc');
      expect(component.form().lastName).toBe('Leclerc');
    });

    it('should not affect other form fields', () => {
      component.form.set({ ...component.form(), part: 'Clavier', lastName: 'Initial' });
      component.updateField('lastName', 'Nouveau');
      expect(component.form().part).toBe('Clavier');
    });
  });

  describe('submitCreate()', () => {
    it('should NOT call facade.create when lastName is empty', () => {
      vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.form.set({ ...component.form(), lastName: '', part: 'Écran' });
      component.submitCreate();
      expect(facade.create).not.toHaveBeenCalled();
    });

    it('should NOT call facade.create when part is empty', () => {
      vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.form.set({ ...component.form(), lastName: 'Dupont', part: '' });
      component.submitCreate();
      expect(facade.create).not.toHaveBeenCalled();
    });

    it('should NOT call facade.create when both lastName and part are whitespace', () => {
      vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.form.set({ ...component.form(), lastName: '   ', part: '   ' });
      component.submitCreate();
      expect(facade.create).not.toHaveBeenCalled();
    });

    it('should call facade.create with form data and currentUserName when lastName and part are filled', () => {
      const createSpy = vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.currentUserName.set('admin');
      const formData = { ...component.form(), lastName: 'Dupont', part: 'Écran' };
      component.form.set(formData);
      component.submitCreate();
      expect(createSpy).toHaveBeenCalledWith(formData, 'admin');
    });

    it('should include the linked client file id as clientFile when one is selected', () => {
      const createSpy = vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.currentUserName.set('admin');
      component.linkedClientFileId.set('cf1');
      const formData = { ...component.form(), lastName: 'Dupont', part: 'Écran' };
      component.form.set(formData);
      component.submitCreate();
      expect(createSpy).toHaveBeenCalledWith({ ...formData, clientFile: 'cf1' }, 'admin');
    });

    it('should reset form to empty after successful submit', () => {
      vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.form.set({
        ...component.form(),
        lastName: 'Dupont',
        part: 'Écran',
        city: 'Paris',
      });
      component.submitCreate();
      expect(component.form().lastName).toBe('');
      expect(component.form().part).toBe('');
      expect(component.form().city).toBe('');
    });

    it('should clear linkedClientFileId and hide form after successful submit', () => {
      vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.linkedClientFileId.set('cf1');
      component.showForm.set(true);
      component.form.set({ ...component.form(), lastName: 'Dupont', part: 'Écran' });
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
    it('should return uppercase lastName when firstName and company are absent', () => {
      const cf = { ...sampleClientFile, firstName: undefined, company: undefined };
      expect(component.clientFileLabel(cf)).toBe('MARTIN');
    });

    it('should include firstName when present', () => {
      const cf = { ...sampleClientFile, firstName: 'Claire', company: undefined };
      expect(component.clientFileLabel(cf)).toBe('MARTIN Claire');
    });

    it('should include company with separator when present', () => {
      const cf = { ...sampleClientFile, firstName: undefined, company: 'Brasserie Nord' };
      expect(component.clientFileLabel(cf)).toBe('MARTIN - Brasserie Nord');
    });

    it('should include both firstName and company when both present', () => {
      const cf = { ...sampleClientFile, firstName: 'Claire', company: 'Brasserie Nord' };
      expect(component.clientFileLabel(cf)).toBe('MARTIN Claire - Brasserie Nord');
    });
  });
});
