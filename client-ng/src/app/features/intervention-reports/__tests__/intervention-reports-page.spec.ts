import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';
import { Router } from '@angular/router';
import { InterventionReportsPage } from '../intervention-reports-page';
import { InterventionReportsFacade } from '../store/intervention-reports.facade';
import { initialInterventionReportsState } from '../store/intervention-reports.state';
import { LanguageService } from '../../../core/services/language.service';
import type { InterventionReport } from '../../../shared/models/intervention-report.model';

const initialState = { interventionReports: initialInterventionReportsState };
const mockNavigate = vi.fn();

const makeReport = (overrides: Partial<InterventionReport> = {}): InterventionReport => ({
  _id: 'r1',
  clientFile: { _id: 'cf1', lastName: 'Dupont', company: 'SARL', city: 'Paris' },
  cashguardUnits: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...overrides,
});

describe('InterventionReportsPage', () => {
  let component: InterventionReportsPage;
  let facade: InterventionReportsFacade;

  beforeEach(async () => {
    TestBed.overrideComponent(InterventionReportsPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [InterventionReportsPage],
      providers: [
        provideMockStore({ initialState }),
        { provide: Router, useValue: { navigate: mockNavigate } },
        { provide: LanguageService, useValue: { current: 'fr' } },
      ],
    }).compileComponents();

    facade = TestBed.inject(InterventionReportsFacade);
    vi.spyOn(facade, 'loadAll').mockImplementation(() => {});
    mockNavigate.mockClear();

    const fixture = TestBed.createComponent(InterventionReportsPage);
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
    const reportA = makeReport({
      _id: 'r1',
      clientFile: { _id: 'cf1', lastName: 'Dupont', company: 'SARL', city: 'Paris' },
    });
    const reportB = makeReport({
      _id: 'r2',
      clientFile: { _id: 'cf2', lastName: 'Martin', company: 'SAS', city: 'Lyon' },
    });

    it('with no searchTerm returns all reports unchanged', () => {
      component.searchTerm.set('');
      const result = component.filter([reportA, reportB]);
      expect(result).toEqual([reportA, reportB]);
    });

    it('with searchTerm matching lastName returns matching report', () => {
      component.searchTerm.set('dupont');
      const result = component.filter([reportA, reportB]);
      expect(result).toEqual([reportA]);
    });

    it('with searchTerm matching company returns matching report', () => {
      component.searchTerm.set('sarl');
      const result = component.filter([reportA, reportB]);
      expect(result).toEqual([reportA]);
    });

    it('with searchTerm matching city returns matching report', () => {
      component.searchTerm.set('lyon');
      const result = component.filter([reportA, reportB]);
      expect(result).toEqual([reportB]);
    });

    it('with searchTerm not matching returns empty array', () => {
      component.searchTerm.set('zzznomatch');
      const result = component.filter([reportA, reportB]);
      expect(result).toEqual([]);
    });

    it('with string clientFile matches against string', () => {
      const reportStr = makeReport({ _id: 'r3', clientFile: 'clientfile-string-id' });
      component.searchTerm.set('clientfile');
      const result = component.filter([reportStr]);
      expect(result).toEqual([reportStr]);
    });

    it('with string clientFile does not match unrelated term', () => {
      const reportStr = makeReport({ _id: 'r3', clientFile: 'clientfile-string-id' });
      component.searchTerm.set('zzznomatch');
      const result = component.filter([reportStr]);
      expect(result).toEqual([]);
    });
  });

  describe('getClientLabel()', () => {
    it('with object clientFile having lastName and company returns "lastName - company"', () => {
      const report = makeReport({
        clientFile: { _id: 'cf1', lastName: 'Dupont', company: 'SARL', city: 'Paris' },
      });
      expect(component.getClientLabel(report)).toBe('Dupont - SARL');
    });

    it('with object clientFile having lastName only returns "lastName"', () => {
      const report = makeReport({ clientFile: { _id: 'cf1', lastName: 'Dupont' } });
      expect(component.getClientLabel(report)).toBe('Dupont');
    });

    it('with object clientFile having company only returns "company"', () => {
      const report = makeReport({ clientFile: { _id: 'cf1', lastName: '', company: 'SARL' } });
      expect(component.getClientLabel(report)).toBe('SARL');
    });

    it('with string clientFile returns the string', () => {
      const report = makeReport({ clientFile: 'some-client-id' });
      expect(component.getClientLabel(report)).toBe('some-client-id');
    });
  });

  describe('getClientFileId()', () => {
    it('with object clientFile returns cf._id', () => {
      const report = makeReport({ clientFile: { _id: 'cf1', lastName: 'Dupont' } });
      expect(component.getClientFileId(report)).toBe('cf1');
    });

    it('with string clientFile returns the string', () => {
      const report = makeReport({ clientFile: 'cf-string-id' });
      expect(component.getClientFileId(report)).toBe('cf-string-id');
    });

    it('with empty string clientFile returns empty string', () => {
      const report = makeReport({ clientFile: '' });
      expect(component.getClientFileId(report)).toBe('');
    });
  });

  describe('openClientFile()', () => {
    it('navigates to /client-files/:id when clientFile is an object', () => {
      const report = makeReport({ clientFile: { _id: 'cf1', lastName: 'Dupont' } });
      component.openClientFile(report);
      expect(mockNavigate).toHaveBeenCalledWith(['/client-files', 'cf1']);
    });

    it('navigates to /client-files/:id when clientFile is a string', () => {
      const report = makeReport({ clientFile: 'cf-string-id' });
      component.openClientFile(report);
      expect(mockNavigate).toHaveBeenCalledWith(['/client-files', 'cf-string-id']);
    });

    it('does not navigate when clientFile is empty string', () => {
      const report = makeReport({ clientFile: '' });
      component.openClientFile(report);
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
