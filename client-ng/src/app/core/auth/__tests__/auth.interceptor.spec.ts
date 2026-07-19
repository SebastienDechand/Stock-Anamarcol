import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from '../auth.interceptor';

const mockNavigate = vi.fn();

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: { navigate: mockNavigate },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    mockNavigate.mockClear();
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

  it('should navigate to / on 401 response', () => {
    http.get('/api/protected').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(mockNavigate).toHaveBeenCalledWith(['/']);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('should rethrow the error after navigating on 401', () => {
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

  it('should NOT navigate on 404 response', () => {
    http.get('/api/missing').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/missing');
    req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should NOT navigate on 500 response', () => {
    http.get('/api/error').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/error');
    req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(mockNavigate).not.toHaveBeenCalled();
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
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
