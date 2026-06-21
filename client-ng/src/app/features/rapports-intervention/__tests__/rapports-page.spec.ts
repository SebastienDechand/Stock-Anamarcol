import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';
import { Router } from '@angular/router';
import { RapportsPage } from '../rapports-page';
import { RapportsFacade } from '../store/rapports.facade';
import { initialRapportsState } from '../store/rapports.state';
import type { InterventionReport } from '../../../shared/models/intervention-report.model';

const initialState = { rapports: initialRapportsState };
const mockNavigate = vi.fn();

const makeRapport = (overrides: Partial<InterventionReport> = {}): InterventionReport => ({
  _id: 'r1',
  clientFile: { _id: 'cf1', nom: 'Dupont', societe: 'SARL', ville: 'Paris' },
  cashguardUnits: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...overrides,
});

describe('RapportsPage', () => {
  let component: RapportsPage;
  let facade: RapportsFacade;

  beforeEach(async () => {
    TestBed.overrideComponent(RapportsPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [RapportsPage],
      providers: [
        provideMockStore({ initialState }),
        { provide: Router, useValue: { navigate: mockNavigate } },
      ],
    }).compileComponents();

    facade = TestBed.inject(RapportsFacade);
    vi.spyOn(facade, 'loadAll').mockImplementation(() => {});
    mockNavigate.mockClear();

    const fixture = TestBed.createComponent(RapportsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit calls facade.loadAll', () => {
    expect(facade.loadAll).toHaveBeenCalledTimes(1);
  });

  describe('filter()', () => {
    const rapportA = makeRapport({
      _id: 'r1',
      clientFile: { _id: 'cf1', nom: 'Dupont', societe: 'SARL', ville: 'Paris' },
    });
    const rapportB = makeRapport({
      _id: 'r2',
      clientFile: { _id: 'cf2', nom: 'Martin', societe: 'SAS', ville: 'Lyon' },
    });

    it('with no searchTerm returns all rapports unchanged', () => {
      component.searchTerm.set('');
      const result = component.filter([rapportA, rapportB]);
      expect(result).toEqual([rapportA, rapportB]);
    });

    it('with searchTerm matching nom returns matching rapport', () => {
      component.searchTerm.set('dupont');
      const result = component.filter([rapportA, rapportB]);
      expect(result).toEqual([rapportA]);
    });

    it('with searchTerm matching societe returns matching rapport', () => {
      component.searchTerm.set('sarl');
      const result = component.filter([rapportA, rapportB]);
      expect(result).toEqual([rapportA]);
    });

    it('with searchTerm matching ville returns matching rapport', () => {
      component.searchTerm.set('lyon');
      const result = component.filter([rapportA, rapportB]);
      expect(result).toEqual([rapportB]);
    });

    it('with searchTerm not matching returns empty array', () => {
      component.searchTerm.set('zzznomatch');
      const result = component.filter([rapportA, rapportB]);
      expect(result).toEqual([]);
    });

    it('with string clientFile matches against string', () => {
      const rapportStr = makeRapport({ _id: 'r3', clientFile: 'clientfile-string-id' });
      component.searchTerm.set('clientfile');
      const result = component.filter([rapportStr]);
      expect(result).toEqual([rapportStr]);
    });

    it('with string clientFile does not match unrelated term', () => {
      const rapportStr = makeRapport({ _id: 'r3', clientFile: 'clientfile-string-id' });
      component.searchTerm.set('zzznomatch');
      const result = component.filter([rapportStr]);
      expect(result).toEqual([]);
    });
  });

  describe('getClientLabel()', () => {
    it('with object clientFile having nom and societe returns "nom - societe"', () => {
      const rapport = makeRapport({
        clientFile: { _id: 'cf1', nom: 'Dupont', societe: 'SARL', ville: 'Paris' },
      });
      expect(component.getClientLabel(rapport)).toBe('Dupont - SARL');
    });

    it('with object clientFile having nom only returns "nom"', () => {
      const rapport = makeRapport({ clientFile: { _id: 'cf1', nom: 'Dupont' } });
      expect(component.getClientLabel(rapport)).toBe('Dupont');
    });

    it('with object clientFile having societe only returns "societe"', () => {
      const rapport = makeRapport({ clientFile: { _id: 'cf1', nom: '', societe: 'SARL' } });
      expect(component.getClientLabel(rapport)).toBe('SARL');
    });

    it('with string clientFile returns the string', () => {
      const rapport = makeRapport({ clientFile: 'some-client-id' });
      expect(component.getClientLabel(rapport)).toBe('some-client-id');
    });
  });

  describe('getClientFileId()', () => {
    it('with object clientFile returns cf._id', () => {
      const rapport = makeRapport({ clientFile: { _id: 'cf1', nom: 'Dupont' } });
      expect(component.getClientFileId(rapport)).toBe('cf1');
    });

    it('with string clientFile returns the string', () => {
      const rapport = makeRapport({ clientFile: 'cf-string-id' });
      expect(component.getClientFileId(rapport)).toBe('cf-string-id');
    });

    it('with empty string clientFile returns empty string', () => {
      const rapport = makeRapport({ clientFile: '' });
      expect(component.getClientFileId(rapport)).toBe('');
    });
  });

  describe('openDossier()', () => {
    it('navigates to /fiches-clients/:id when clientFile is an object', () => {
      const rapport = makeRapport({ clientFile: { _id: 'cf1', nom: 'Dupont' } });
      component.openDossier(rapport);
      expect(mockNavigate).toHaveBeenCalledWith(['/fiches-clients', 'cf1']);
    });

    it('navigates to /fiches-clients/:id when clientFile is a string', () => {
      const rapport = makeRapport({ clientFile: 'cf-string-id' });
      component.openDossier(rapport);
      expect(mockNavigate).toHaveBeenCalledWith(['/fiches-clients', 'cf-string-id']);
    });

    it('does not navigate when clientFile is empty string', () => {
      const rapport = makeRapport({ clientFile: '' });
      component.openDossier(rapport);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('formatDate()', () => {
    it('returns "-" for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('returns localized string for valid date', () => {
      const result = component.formatDate('2024-03-15T00:00:00.000Z');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });
});
