import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { LoginPage } from '../login-page';
import { AuthFacade } from '../../../store/auth/auth.facade';
import { initialAuthState } from '../../../store/auth/auth.state';
import { LanguageService } from '../../../core/services/language.service';

const initialState = { auth: initialAuthState };

describe('LoginPage', () => {
  let component: LoginPage;
  let authFacade: AuthFacade;

  beforeEach(async () => {
    TestBed.overrideComponent(LoginPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideMockStore({ initialState }),
        {
          provide: LanguageService,
          useValue: { lang$: of('fr'), current: 'fr', toggle: vi.fn(), set: vi.fn() },
        },
      ],
    }).compileComponents();

    authFacade = TestBed.inject(AuthFacade);

    const fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('toggleLanguage()', () => {
    it('should call languageService.toggle()', () => {
      const toggleSpy = vi.spyOn(component['languageService'], 'toggle');
      component.toggleLanguage();
      expect(toggleSpy).toHaveBeenCalled();
    });
  });

  describe('togglePassword()', () => {
    it('should have initial value false', () => {
      expect(component.showPassword()).toBe(false);
    });

    it('should set showPassword to true on first call', () => {
      component.togglePassword();
      expect(component.showPassword()).toBe(true);
    });

    it('should set showPassword back to false on second call', () => {
      component.togglePassword();
      component.togglePassword();
      expect(component.showPassword()).toBe(false);
    });
  });

  describe('onSubmit()', () => {
    it('should NOT call authFacade.login when email and password are both empty', () => {
      const loginSpy = vi.spyOn(authFacade, 'login').mockImplementation(() => {});
      component.email.set('');
      component.password.set('');
      component.onSubmit();
      expect(loginSpy).not.toHaveBeenCalled();
    });

    it('should NOT call authFacade.login when only email is set', () => {
      const loginSpy = vi.spyOn(authFacade, 'login').mockImplementation(() => {});
      component.email.set('test@example.com');
      component.password.set('');
      component.onSubmit();
      expect(loginSpy).not.toHaveBeenCalled();
    });

    it('should NOT call authFacade.login when only password is set', () => {
      const loginSpy = vi.spyOn(authFacade, 'login').mockImplementation(() => {});
      component.email.set('');
      component.password.set('mypassword');
      component.onSubmit();
      expect(loginSpy).not.toHaveBeenCalled();
    });

    it('should call authFacade.login with email and password when both are set', () => {
      const loginSpy = vi.spyOn(authFacade, 'login').mockImplementation(() => {});
      component.email.set('test@example.com');
      component.password.set('mypassword');
      component.onSubmit();
      expect(loginSpy).toHaveBeenCalledWith('test@example.com', 'mypassword');
    });
  });
});
