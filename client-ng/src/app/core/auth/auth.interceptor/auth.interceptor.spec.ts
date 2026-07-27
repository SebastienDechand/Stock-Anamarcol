import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Store } from '@ngrx/store';
import { authInterceptor } from './auth.interceptor';
import { AuthActions } from '../../../store/auth/actions/auth.actions';

const mockDispatch = vi.fn();

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: Store,
          useValue: { dispatch: mockDispatch },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    mockDispatch.mockClear();
  });

  afterEach(() => httpMock.verify());

  it('should add withCredentials: true to every outgoing request', () => {
    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('should add withCredentials on POST requests', () => {
    http.post('/api/login', { email: 'a@b.com' }).subscribe();

    const req = httpMock.expectOne('/api/login');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('should add withCredentials on PUT requests', () => {
    http.put('/api/user/123', { username: 'test' }).subscribe();

    const req = httpMock.expectOne('/api/user/123');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('should dispatch logout on 401 response', () => {
    http.get('/api/protected').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(mockDispatch).toHaveBeenCalledWith(AuthActions.logout());
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('should rethrow the error after dispatching on 401', () => {
    let errorCalled = false;

    http.get('/api/protected').subscribe({
      error: () => {
        errorCalled = true;
      },
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(errorCalled).toBe(true);
  });

  it('should NOT dispatch on 404 response', () => {
    http.get('/api/missing').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/missing');
    req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should NOT dispatch on 500 response', () => {
    http.get('/api/error').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/error');
    req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should rethrow errors that are not 401', () => {
    let errorCalled = false;

    http.get('/api/missing').subscribe({
      error: () => {
        errorCalled = true;
      },
    });

    const req = httpMock.expectOne('/api/missing');
    req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    expect(errorCalled).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
