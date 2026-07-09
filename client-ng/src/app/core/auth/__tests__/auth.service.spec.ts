import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../auth.service';
import { Role } from '../../../shared/constants/roles.constants';

const BASE = '/';

const mockUser = {
  _id: 'user-123',
  pseudo: 'testuser',
  email: 'test@example.com',
  picture: 'https://example.com/pic.jpg',
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('checkSession', () => {
    it('should GET jwtid with withCredentials', () => {
      const mockResponse = { _id: 'user-123', roles: [Role.ADMIN] };

      service.checkSession().subscribe((result) => {
        expect(result.uid).toBe('user-123');
        expect(result.roles).toEqual([Role.ADMIN]);
      });

      const req = httpMock.expectOne(`${BASE}jwtid`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);
    });

    it('should default roles to [Role.USER] when roles array is empty', () => {
      const mockResponse = { _id: 'user-123', roles: [] };

      service.checkSession().subscribe((result) => {
        expect(result.roles).toEqual([Role.USER]);
      });

      const req = httpMock.expectOne(`${BASE}jwtid`);
      req.flush(mockResponse);
    });

    it('should default roles to [Role.USER] when roles is missing', () => {
      const mockResponse = { _id: 'user-123' };

      service.checkSession().subscribe((result) => {
        expect(result.roles).toEqual([Role.USER]);
      });

      const req = httpMock.expectOne(`${BASE}jwtid`);
      req.flush(mockResponse);
    });

    it('should use the raw response as uid when _id is missing', () => {
      service.checkSession().subscribe((result) => {
        expect(result.uid).toBe('legacy-uid-string');
      });

      const req = httpMock.expectOne(`${BASE}jwtid`);
      req.flush('legacy-uid-string');
    });
  });

  describe('login', () => {
    it('should POST to api/user/login with credentials and return void', () => {
      let emitted = false;

      service.login('user@test.com', 'secret').subscribe(() => {
        emitted = true;
      });

      const req = httpMock.expectOne(`${BASE}api/user/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual({ email: 'user@test.com', password: 'secret' });
      req.flush({});

      expect(emitted).toBe(true);
    });
  });

  describe('logout', () => {
    it('should GET api/user/logout with withCredentials and return void', () => {
      let emitted = false;

      service.logout().subscribe(() => {
        emitted = true;
      });

      const req = httpMock.expectOne(`${BASE}api/user/logout`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush({});

      expect(emitted).toBe(true);
    });
  });

  describe('getUserProfile', () => {
    it('should GET api/user/:uid with withCredentials', () => {
      service.getUserProfile('user-123').subscribe((result) => {
        expect(result).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${BASE}api/user/user-123`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockUser);
    });
  });

  describe('updateUserProfile', () => {
    it('should PUT api/user/:uid with partial data and withCredentials', () => {
      const partial = { pseudo: 'newname' };
      const updated = { ...mockUser, pseudo: 'newname' };

      service.updateUserProfile('user-123', partial).subscribe((result) => {
        expect(result).toEqual(updated);
      });

      const req = httpMock.expectOne(`${BASE}api/user/user-123`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual(partial);
      req.flush(updated);
    });
  });

  describe('uploadProfilePicture', () => {
    it('should POST api/user/upload?id=:uid with FormData and withCredentials', () => {
      const formData = new FormData();
      formData.append('file', new Blob(['img'], { type: 'image/jpeg' }), 'photo.jpg');

      service.uploadProfilePicture('user-123', formData).subscribe((result) => {
        expect(result).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${BASE}api/user/upload?id=user-123`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toBeInstanceOf(FormData);
      req.flush(mockUser);
    });
  });
});
