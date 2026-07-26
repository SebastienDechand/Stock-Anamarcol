import { TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';
import { HistoryPage } from './history-page';
import { AuthFacade } from '../../store/auth/facade/auth.facade';
import { HistoryFacade } from './store/facade/history.facade';
import { initialAuthState } from '../../store/auth/state/auth.state';
import { initialHistoryState } from './store/state/history.state';
import { LanguageService } from '../../core/services/language/language.service';
import { TranslateService } from '@ngx-translate/core';
import type { AuditEvent } from '../../shared/models/audit/audit.model';

const initialState = { auth: initialAuthState, history: initialHistoryState };

const makeEvent = (overrides: Partial<AuditEvent> = {}): AuditEvent => ({
  _id: 'e1',
  userName: 'Alice',
  action: 'create',
  entity: 'article',
  details: {},
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('HistoryPage', () => {
  let component: HistoryPage;

  beforeEach(async () => {
    TestBed.overrideComponent(HistoryPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [
        provideMockStore({ initialState }),
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
        { provide: LanguageService, useValue: { current: 'fr' } },
      ],
    }).compileComponents();

    const facade = TestBed.inject(HistoryFacade);
    vi.spyOn(facade, 'loadEvents').mockImplementation(() => {});
    vi.spyOn(facade, 'loadUsers').mockImplementation(() => {});
    vi.spyOn(facade, 'purge').mockImplementation(() => {});

    const fixture = TestBed.createComponent(HistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('filteredEvents', () => {
    it('returns empty when allEvents is empty', () => {
      component.allEvents.set([]);
      expect(component.filteredEvents).toEqual([]);
    });

    it('filters out events without userName', () => {
      const withUser = makeEvent({ userName: 'Alice' });
      const withoutUser = makeEvent({ userName: undefined });
      const withEmptyUser = makeEvent({ userName: '' });
      component.allEvents.set([withUser, withoutUser, withEmptyUser]);
      expect(component.filteredEvents).toHaveLength(1);
      expect(component.filteredEvents[0].userName).toBe('Alice');
    });

    it('filters out quantity-only update events', () => {
      const quantityUpdate = makeEvent({
        action: 'update',
        details: { field: 'quantity' },
        userName: 'Alice',
        entity: 'article',
      });
      const otherUpdate = makeEvent({
        action: 'update',
        details: { field: 'name' },
        userName: 'Alice',
        entity: 'article',
      });
      component.allEvents.set([quantityUpdate, otherUpdate]);
      expect(component.filteredEvents).toHaveLength(1);
      expect(component.filteredEvents[0]?.details?.['field']).toBe('name');
    });

    it('returns all events when activeFilter is "all" and no search', () => {
      const events = [
        makeEvent({ action: 'create' }),
        makeEvent({ action: 'update', details: { field: 'name' } }),
        makeEvent({ action: 'delete' }),
      ];
      component.allEvents.set(events);
      component.activeFilter.set('all');
      component.searchTerm.set('');
      expect(component.filteredEvents).toHaveLength(3);
    });

    it('when activeFilter is "create", returns only create events', () => {
      const events = [
        makeEvent({ action: 'create' }),
        makeEvent({ action: 'update', details: { field: 'name' } }),
        makeEvent({ action: 'delete' }),
      ];
      component.allEvents.set(events);
      component.activeFilter.set('create');
      expect(component.filteredEvents).toHaveLength(1);
      expect(component.filteredEvents[0].action).toBe('create');
    });

    it('when activeFilter is "upload", returns events with action upload, upload_document, or delete_document', () => {
      const events = [
        makeEvent({ action: 'upload' }),
        makeEvent({ action: 'upload_document' }),
        makeEvent({ action: 'delete_document' }),
        makeEvent({ action: 'create' }),
        makeEvent({ action: 'delete' }),
      ];
      component.allEvents.set(events);
      component.activeFilter.set('upload');
      expect(component.filteredEvents).toHaveLength(3);
      const actions = component.filteredEvents.map((e) => e.action);
      expect(actions).toContain('upload');
      expect(actions).toContain('upload_document');
      expect(actions).toContain('delete_document');
    });

    it('when selectedUsers is non-empty, only returns events from those users', () => {
      const events = [
        makeEvent({ userName: 'Alice' }),
        makeEvent({ userName: 'Bob' }),
        makeEvent({ userName: 'Charlie' }),
      ];
      component.allEvents.set(events);
      component.selectedUsers.set(['Alice', 'Charlie']);
      expect(component.filteredEvents).toHaveLength(2);
      const names = component.filteredEvents.map((e) => e.userName);
      expect(names).toContain('Alice');
      expect(names).toContain('Charlie');
      expect(names).not.toContain('Bob');
    });

    it('when searchTerm matches userName, returns matching events', () => {
      const events = [makeEvent({ userName: 'Alice' }), makeEvent({ userName: 'Bob' })];
      component.allEvents.set(events);
      component.searchTerm.set('ali');
      expect(component.filteredEvents).toHaveLength(1);
      expect(component.filteredEvents[0].userName).toBe('Alice');
    });

    it('when searchTerm matches entity, returns matching events', () => {
      const events = [makeEvent({ entity: 'article' }), makeEvent({ entity: 'document' })];
      component.allEvents.set(events);
      component.searchTerm.set('doc');
      expect(component.filteredEvents).toHaveLength(1);
      expect(component.filteredEvents[0].entity).toBe('document');
    });
  });

  describe('toggleUser()', () => {
    it('adds user when not already selected', () => {
      component.selectedUsers.set([]);
      component.toggleUser('Alice');
      expect(component.selectedUsers()).toContain('Alice');
    });

    it('removes user when already selected', () => {
      component.selectedUsers.set(['Alice', 'Bob']);
      component.toggleUser('Alice');
      expect(component.selectedUsers()).not.toContain('Alice');
      expect(component.selectedUsers()).toContain('Bob');
    });
  });

  describe('clearUsers()', () => {
    it('clears selectedUsers signal', () => {
      component.selectedUsers.set(['Alice', 'Bob', 'Charlie']);
      component.clearUsers();
      expect(component.selectedUsers()).toEqual([]);
    });
  });

  describe('onDocumentMousedown()', () => {
    it('closes the user dropdown when clicking outside of it', () => {
      const dropdownEl = document.createElement('div');
      const outsideEl = document.createElement('div');
      document.body.appendChild(dropdownEl);
      document.body.appendChild(outsideEl);
      component.userDropdownEl = { nativeElement: dropdownEl } as ElementRef<HTMLElement>;
      component.userDropdownOpen.set(true);

      component.onDocumentMousedown({ target: outsideEl } as unknown as MouseEvent);

      expect(component.userDropdownOpen()).toBe(false);
      dropdownEl.remove();
      outsideEl.remove();
    });

    it('keeps the user dropdown open when clicking inside of it', () => {
      const dropdownEl = document.createElement('div');
      const innerEl = document.createElement('button');
      dropdownEl.appendChild(innerEl);
      document.body.appendChild(dropdownEl);
      component.userDropdownEl = { nativeElement: dropdownEl } as ElementRef<HTMLElement>;
      component.userDropdownOpen.set(true);

      component.onDocumentMousedown({ target: innerEl } as unknown as MouseEvent);

      expect(component.userDropdownOpen()).toBe(true);
      dropdownEl.remove();
    });

    it('does nothing when the dropdown is already closed', () => {
      const dropdownEl = document.createElement('div');
      component.userDropdownEl = { nativeElement: dropdownEl } as ElementRef<HTMLElement>;
      component.userDropdownOpen.set(false);

      component.onDocumentMousedown({ target: document.body } as unknown as MouseEvent);

      expect(component.userDropdownOpen()).toBe(false);
    });
  });
});
