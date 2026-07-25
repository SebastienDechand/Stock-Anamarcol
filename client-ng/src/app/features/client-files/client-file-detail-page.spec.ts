import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { ClientFileDetailPage } from './client-file-detail-page';
import { ClientFilesFacade } from './store/facade/client-files.facade';
import { InterventionReportsFacade } from '../intervention-reports/store/facade/intervention-reports.facade';
import { initialClientFilesState } from './store/state/client-files.state';
import { initialInterventionReportsState } from '../intervention-reports/store/state/intervention-reports.state';
import { initialAuthState } from '../../store/auth/state/auth.state';
import { ApiService } from '../../core/http/api.service';
import { ToastService } from '../../core/toast/toast.service';
import { LanguageService } from '../../core/services/language/language.service';
import { ClientFile } from '../../shared/models/client-file/client-file.model';
import {
  CashguardUnit,
  InterventionReport,
} from '../../shared/models/intervention-report/intervention-report.model';
import { Shipment } from '../../shared/models/shipment/shipment.model';

const initialState = {
  clientFiles: initialClientFilesState,
  interventionReports: initialInterventionReportsState,
  auth: initialAuthState,
};

const makeClientFile = (overrides: Partial<ClientFile> = {}): ClientFile => ({
  _id: 'file-1',
  lastName: 'Dupont',
  firstName: 'Jean',
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
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...overrides,
});

const makeReport = (overrides: Partial<InterventionReport> = {}): InterventionReport => {
  const base: InterventionReport = {
    _id: 'report-1',
    clientFile: 'file-id-1',
    cashguardUnits: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };
  return Object.assign(base, overrides);
};

const makeShipment = (overrides: Partial<Shipment> = {}): Shipment => {
  const base: Shipment = {
    _id: 'shipment-1',
    lastName: 'Dupont',
    firstName: 'Jean',
    address: '1 rue de la Paix',
    postalCode: '75001',
    city: 'Paris',
    companyOrRole: 'SARL',
    company: 'SARL Dupont',
    part: 'Caisse',
  };
  return Object.assign(base, overrides);
};

describe('ClientFileDetailPage', () => {
  let component: ClientFileDetailPage;
  let filesFacade: ClientFilesFacade;
  let interventionReportsFacade: InterventionReportsFacade;

  beforeEach(async () => {
    TestBed.overrideComponent(ClientFileDetailPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [ClientFileDetailPage],
      providers: [
        provideMockStore({ initialState }),
        {
          provide: ApiService,
          useValue: {
            get: vi.fn().mockReturnValue(of([])),
            put: vi.fn().mockReturnValue(of({})),
            postFormData: vi.fn().mockReturnValue(of({})),
            delete: vi.fn().mockReturnValue(of({})),
          },
        },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: LanguageService, useValue: { current: 'fr' } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: vi.fn().mockReturnValue('file-id-1') } } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: DomSanitizer,
          useValue: { bypassSecurityTrustResourceUrl: vi.fn().mockReturnValue('trusted-url') },
        },
      ],
    }).compileComponents();

    filesFacade = TestBed.inject(ClientFilesFacade);
    interventionReportsFacade = TestBed.inject(InterventionReportsFacade);
    vi.spyOn(filesFacade, 'loadOne').mockImplementation(() => {});
    vi.spyOn(interventionReportsFacade, 'loadByClientFile').mockImplementation(() => {});

    const fixture = TestBed.createComponent(ClientFileDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // #region Smoke test

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  // #endregion

  // #region ngOnInit

  it('ngOnInit calls filesFacade.loadOne and interventionReportsFacade.loadByClientFile with the route id', () => {
    expect(filesFacade.loadOne).toHaveBeenCalledWith('file-id-1');
    expect(interventionReportsFacade.loadByClientFile).toHaveBeenCalledWith('file-id-1');
  });
  // #endregion

  // #region openWizard()

  describe('openWizard()', () => {
    it('sets wizardOpen to true and editReport to null when called without argument', () => {
      component.wizardOpen.set(false);
      component.editReport.set(null);

      component.openWizard();

      expect(component.wizardOpen()).toBe(true);
      expect(component.editReport()).toBeNull();
    });

    it('sets wizardOpen to true and editReport to the provided report', () => {
      const report = makeReport({ _id: 'report-42' });

      component.openWizard(report);

      expect(component.wizardOpen()).toBe(true);
      expect(component.editReport()).toBe(report);
    });
  });
  // #endregion

  // #region onWizardSaved()

  describe('onWizardSaved()', () => {
    it('sets wizardOpen to false and editReport to null', () => {
      component.wizardOpen.set(true);
      component.editReport.set(makeReport());

      component.onWizardSaved();

      expect(component.wizardOpen()).toBe(false);
      expect(component.editReport()).toBeNull();
    });

    it('calls interventionReportsFacade.loadByClientFile with the current fileId', () => {
      vi.mocked(interventionReportsFacade.loadByClientFile).mockClear();

      component.onWizardSaved();

      expect(interventionReportsFacade.loadByClientFile).toHaveBeenCalledWith('file-id-1');
    });
  });
  // #endregion

  // #region confirmDeleteReport()

  describe('confirmDeleteReport()', () => {
    it('calls interventionReportsFacade.delete with the deleteReportId and clears the signal', () => {
      vi.spyOn(interventionReportsFacade, 'delete').mockImplementation(() => {});
      component.deleteReportId.set('report-99');

      component.confirmDeleteReport();

      expect(interventionReportsFacade.delete).toHaveBeenCalledWith('report-99');
      expect(component.deleteReportId()).toBeNull();
    });

    it('does NOT call interventionReportsFacade.delete when deleteReportId is null', () => {
      vi.spyOn(interventionReportsFacade, 'delete').mockImplementation(() => {});
      component.deleteReportId.set(null);

      component.confirmDeleteReport();

      expect(interventionReportsFacade.delete).not.toHaveBeenCalled();
    });
  });
  // #endregion

  // #region formatDate()

  describe('formatDate()', () => {
    it('returns "-" for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('returns a localized French date string for a valid date', () => {
      // 2024-06-15 → "15/06/2024" in fr-FR locale
      const result = component.formatDate('2024-06-15');
      expect(result).toMatch(/15.06.2024/);
    });
  });
  // #endregion

  // #region getClientLabel()

  describe('getClientLabel()', () => {
    it('returns "NOM firstName - company" when all fields are set', () => {
      const file = makeClientFile({ lastName: 'dupont', firstName: 'Jean', company: 'SARL Dupont' });

      const label = component.getClientLabel(file);

      expect(label).toBe('DUPONT Jean - SARL Dupont');
    });

    it('returns uppercased lastName only when firstName and company are absent', () => {
      const file = makeClientFile({ lastName: 'dupont', firstName: undefined, company: undefined });

      const label = component.getClientLabel(file);

      expect(label).toBe('DUPONT');
    });
  });
  // #endregion

  // #region hasSlots()

  describe('hasSlots()', () => {
    it('returns true when at least one cassetteSlot is non-empty', () => {
      const unit: CashguardUnit = {
        cassetteSlots: ['', 'CG-001', '', ''],
        assignedRegisters: [],
        hasPc: false,
      };
      expect(component.hasSlots(unit)).toBe(true);
    });

    it('returns false when all cassetteSlots are empty strings', () => {
      const unit: CashguardUnit = {
        cassetteSlots: ['', '', '', ''],
        assignedRegisters: [],
        hasPc: false,
      };
      expect(component.hasSlots(unit)).toBe(false);
    });

    it('returns true when only the last slot is non-empty', () => {
      const unit: CashguardUnit = {
        cassetteSlots: ['', '', '', 'CG-004'],
        assignedRegisters: [],
        hasPc: false,
      };
      expect(component.hasSlots(unit)).toBe(true);
    });
  });
  // #endregion

  // #region getTwRegisters()

  describe('getTwRegisters()', () => {
    it('returns twRegisters array when it has items', () => {
      const report = makeReport({ twRegisters: ['A', 'B', 'C'] });

      expect(component.getTwRegisters(report)).toEqual(['A', 'B', 'C']);
    });

    it('returns [twRegister1, twRegister2, twRegister3] (truthy only) when twRegisters is empty', () => {
      const report = makeReport({
        twRegisters: [],
        twRegister1: 'X1',
        twRegister2: '',
        twRegister3: 'X3',
      });

      expect(component.getTwRegisters(report)).toEqual(['X1', 'X3']);
    });

    it('returns empty array when twRegisters is absent and individual fields are falsy', () => {
      const report = makeReport({ twRegisters: undefined });

      expect(component.getTwRegisters(report)).toEqual([]);
    });
  });
  // #endregion

  // #region sentCount / pendingCount

  describe('sentCount and pendingCount computed signals', () => {
    it('reflects correct counts from the shipments signal', () => {
      component.shipments.set([
        makeShipment({ _id: '1', sent: true }),
        makeShipment({ _id: '2', sent: false }),
        makeShipment({ _id: '3', sent: true }),
        makeShipment({ _id: '4', sent: false }),
        makeShipment({ _id: '5', sent: false }),
      ]);

      expect(component.sentCount()).toBe(2);
      expect(component.pendingCount()).toBe(3);
    });

    it('returns 0 for both when shipments is empty', () => {
      component.shipments.set([]);

      expect(component.sentCount()).toBe(0);
      expect(component.pendingCount()).toBe(0);
    });
  });
  // #endregion
});
