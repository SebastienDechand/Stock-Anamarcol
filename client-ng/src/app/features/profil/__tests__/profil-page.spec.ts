import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { ProfilPage } from '../profil-page';
import { VehiclesFacade } from '../../flotte/store/vehicles.facade';
import { AuthFacade } from '../../../store/auth/auth.facade';
import { initialVehiclesState } from '../../flotte/store/vehicles.state';
import { initialAuthState } from '../../../store/auth/auth.state';
import { ApiService } from '../../../core/http/api.service';
import { ToastService } from '../../../core/toast/toast.service';
import type { User } from '../../../shared/models/user.model';
import type { Vehicle } from '../../../shared/models/vehicle.model';

const initialState = { vehicles: initialVehiclesState, auth: initialAuthState };

const makeUser = (overrides: Partial<User> = {}): User => ({
  _id: 'u1',
  pseudo: 'Alice',
  email: 'alice@example.com',
  ...overrides,
});

const makeVehicle = (format: Vehicle['format']): Vehicle => ({
  marque: 'mercedes',
  modele: 'vito',
  format,
  immatriculation: 'AA-123-BB',
  documents: [],
});

describe('ProfilPage', () => {
  let component: ProfilPage;
  let vehiclesFacade: VehiclesFacade;
  let authFacade: AuthFacade;

  beforeEach(async () => {
    TestBed.overrideComponent(ProfilPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [ProfilPage],
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
    vi.spyOn(vehiclesFacade, 'loadAll').mockImplementation(() => {});

    const fixture = TestBed.createComponent(ProfilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit calls vehiclesFacade.loadAll', () => {
    expect(vehiclesFacade.loadAll).toHaveBeenCalled();
  });

  describe('avatarUrl getter', () => {
    it('returns empty string when user is null', () => {
      component.user.set(null);
      expect(component.avatarUrl).toBe('');
    });

    it('returns the url when pic starts with http', () => {
      component.user.set(makeUser({ picture: 'https://example.com/avatar.jpg' }));
      expect(component.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('returns the url when pic starts with /', () => {
      component.user.set(makeUser({ picture: '/static/avatar.jpg' }));
      expect(component.avatarUrl).toBe('/static/avatar.jpg');
    });

    it('prepends / when pic is a relative path', () => {
      component.user.set(makeUser({ picture: 'uploads/avatar.jpg' }));
      expect(component.avatarUrl).toBe('/uploads/avatar.jpg');
    });
  });

  describe('initials getter', () => {
    it('returns ? when user is null', () => {
      component.user.set(null);
      expect(component.initials).toBe('?');
    });

    it('returns first uppercase letter of pseudo when user is set', () => {
      component.user.set(makeUser({ pseudo: 'alice' }));
      expect(component.initials).toBe('A');
    });
  });

  describe('vehicleIcon()', () => {
    it('returns truck for utilitaire', () => {
      expect(component.vehicleIcon(makeVehicle('utilitaire'))).toBe('truck');
    });

    it('returns bus for camion', () => {
      expect(component.vehicleIcon(makeVehicle('camion'))).toBe('bus');
    });

    it('returns car for pickup', () => {
      expect(component.vehicleIcon(makeVehicle('pickup'))).toBe('car');
    });
  });

  describe('saveNumero()', () => {
    it('does nothing when user is null', () => {
      const spy = vi.spyOn(authFacade, 'updateProfile');
      component.user.set(null);
      component.saveNumero();
      expect(spy).not.toHaveBeenCalled();
    });

    it('calls authFacade.updateProfile with user._id and numero when user is set', () => {
      const spy = vi.spyOn(authFacade, 'updateProfile').mockImplementation(() => {});
      component.user.set(makeUser({ _id: 'u1' }));
      component.numero.set('456');
      component.saveNumero();
      expect(spy).toHaveBeenCalledWith('u1', { numero: '456' });
    });

    it('sets editingNumero to false after save', () => {
      vi.spyOn(authFacade, 'updateProfile').mockImplementation(() => {});
      component.user.set(makeUser());
      component.editingNumero.set(true);
      component.saveNumero();
      expect(component.editingNumero()).toBe(false);
    });
  });
});
