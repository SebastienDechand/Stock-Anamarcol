import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from '../api.service';

const BASE = '/';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('get', () => {
    it('should GET with the base URL prefixed to the path', () => {
      const mockData = [{ id: 1, name: 'item' }];

      service.get<typeof mockData>('api/items').subscribe((result) => {
        expect(result).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${BASE}api/items`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should pass query params when provided', () => {
      service.get('api/items', { category: 'tools', page: '2' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${BASE}api/items`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('category')).toBe('tools');
      expect(req.request.params.get('page')).toBe('2');
      req.flush([]);
    });

    it('should support array query params', () => {
      service.get('api/items', { ids: ['1', '2', '3'] }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${BASE}api/items`);
      expect(req.request.params.getAll('ids')).toEqual(['1', '2', '3']);
      req.flush([]);
    });

    it('should not include params when none are provided', () => {
      service.get('api/items').subscribe();

      const req = httpMock.expectOne(`${BASE}api/items`);
      expect(req.request.params.keys()).toHaveLength(0);
      req.flush([]);
    });
  });

  describe('post', () => {
    it('should POST with JSON body to the prefixed path', () => {
      const body = { name: 'new item', value: 42 };
      const mockResponse = { id: 99, ...body };

      service.post<typeof mockResponse>('api/items', body).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${BASE}api/items`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse);
    });
  });

  describe('postFormData', () => {
    it('should POST FormData to the prefixed path', () => {
      const formData = new FormData();
      formData.append('file', new Blob(['content'], { type: 'image/jpeg' }), 'photo.jpg');

      const mockResponse = { url: 'https://example.com/photo.jpg' };

      service.postFormData<typeof mockResponse>('api/upload', formData).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${BASE}api/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      req.flush(mockResponse);
    });
  });

  describe('put', () => {
    it('should PUT with JSON body to the prefixed path', () => {
      const body = { name: 'updated item' };
      const mockResponse = { id: 1, ...body };

      service.put<typeof mockResponse>('api/items/1', body).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${BASE}api/items/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse);
    });
  });

  describe('patch', () => {
    it('should PATCH with partial body to the prefixed path', () => {
      const partial = { status: 'active' };
      const mockResponse = { id: 1, name: 'item', status: 'active' };

      service.patch<typeof mockResponse>('api/items/1', partial).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${BASE}api/items/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(partial);
      req.flush(mockResponse);
    });
  });

  describe('delete', () => {
    it('should DELETE at the prefixed path', () => {
      const mockResponse = { deleted: true };

      service.delete<typeof mockResponse>('api/items/1').subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${BASE}api/items/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('getBlob', () => {
    it('should GET with responseType blob at the prefixed path', () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });

      service.getBlob('api/archives/1/download').subscribe((result) => {
        expect(result).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(`${BASE}api/archives/1/download`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('should pass query params when provided', () => {
      const mockBlob = new Blob(['data']);

      service.getBlob('api/archives/1/download', { format: 'xlsx' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${BASE}api/archives/1/download`);
      expect(req.request.params.get('format')).toBe('xlsx');
      req.flush(mockBlob);
    });
  });
});
