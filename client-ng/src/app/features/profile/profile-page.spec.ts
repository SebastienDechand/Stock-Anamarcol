import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { ProfilePage } from './profile-page';
import { VehiclesFacade } from '../fleet/store/facade/vehicles.facade';
import { AuthFacade } from '../../store/auth/facade/auth.facade';
import { selectCurrentUser } from '../../store/auth/selectors/auth.selectors';
import { initialVehiclesState } from '../fleet/store/state/vehicles.state';
import { initialAuthState } from '../../store/auth/state/auth.state';
import { ApiService } from '../../core/http/api.service';
import { ToastService } from '../../core/toast/toast.service';
import type { User } from '../../shared/models/user/user.model';
import type { Vehicle } from '../../shared/models/vehicle/vehicle.model';

const initialState = { vehicles: initialVehiclesState, auth: initialAuthState };

const makeUser = (overrides: Partial<User> = {}): User => ({
  _id: 'u1',
  username: 'Alice',
  email: 'alice@example.com',
  ...overrides,
});

const makeVehicle = (format: Vehicle['format']): Vehicle => ({
  brand: 'mercedes',
  model: 'vito',
  format,
  licensePlate: 'AA-123-BB',
  documents: [],
});

describe('ProfilePage', () => {
  let component: ProfilePage;
  let vehiclesFacade: VehiclesFacade;
  let authFacade: AuthFacade;
  let store: MockStore;

  function setUser(user: User | null): void {
    store.overrideSelector(selectCurrentUser, user);
    store.refreshState();
  }

  beforeEach(async () => {
    TestBed.overrideComponent(ProfilePage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideMockStore({ initialState }),
        {
          provide: ApiService,
          useValue: { get: vi.fn(), postFormData: vi.fn(), put: vi.fn(), delete: vi.fn() },
        },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
      ],
    }).compileComponents();

    vehiclesFacade = TestBed.inject(VehiclesFacade);
    authFacade = TestBed.inject(AuthFacade);
    store = TestBed.inject(MockStore);
    vi.spyOn(vehiclesFacade, 'loadAll').mockImplementation(() => {});

    const fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    store.resetSelectors();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit calls vehiclesFacade.loadAll', () => {
    expect(vehiclesFacade.loadAll).toHaveBeenCalled();
  });

  describe('avatarUrl getter', () => {
    it('returns empty string when user is null', () => {
      setUser(null);
      expect(component.avatarUrl).toBe('');
    });

    it('returns the url when pic starts with http', () => {
      setUser(makeUser({ picture: 'https://example.com/avatar.jpg' }));
      expect(component.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('returns the url when pic starts with /', () => {
      setUser(makeUser({ picture: '/static/avatar.jpg' }));
      expect(component.avatarUrl).toBe('/static/avatar.jpg');
    });

    it('prepends / when pic is a relative path', () => {
      setUser(makeUser({ picture: 'uploads/avatar.jpg' }));
      expect(component.avatarUrl).toBe('/uploads/avatar.jpg');
    });
  });

  describe('initials getter', () => {
    it('returns ? when user is null', () => {
      setUser(null);
      expect(component.initials).toBe('?');
    });

    it('returns first uppercase letter of username when user is set', () => {
      setUser(makeUser({ username: 'alice' }));
      expect(component.initials).toBe('A');
    });
  });

  describe('vehicleIcon()', () => {
    it('returns truck for van', () => {
      expect(component.vehicleIcon(makeVehicle('van'))).toBe('truck');
    });

    it('returns bus for truck', () => {
      expect(component.vehicleIcon(makeVehicle('truck'))).toBe('bus');
    });

    it('returns car for pickup', () => {
      expect(component.vehicleIcon(makeVehicle('pickup'))).toBe('car');
    });
  });

  describe('savePhone()', () => {
    it('does nothing when user is null', () => {
      const spy = vi.spyOn(authFacade, 'updateProfile');
      setUser(null);
      component.savePhone();
      expect(spy).not.toHaveBeenCalled();
    });

    it('calls authFacade.updateProfile with user._id and phone when user is set', () => {
      const spy = vi.spyOn(authFacade, 'updateProfile').mockImplementation(() => {});
      setUser(makeUser({ _id: 'u1' }));
      component.phone.set('456');
      component.savePhone();
      expect(spy).toHaveBeenCalledWith('u1', { phone: '456' });
    });

    it('sets editingPhone to false after save', () => {
      vi.spyOn(authFacade, 'updateProfile').mockImplementation(() => {});
      setUser(makeUser());
      component.editingPhone.set(true);
      component.savePhone();
      expect(component.editingPhone()).toBe(false);
    });
  });
});
