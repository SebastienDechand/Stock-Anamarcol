import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { EventEmitter } from 'events';

const mockHttpGet = vi.hoisted(() => vi.fn());

vi.mock('http', () => ({
  __esModule: true,
  default: { get: mockHttpGet },
  get: mockHttpGet,
}));

import { getCameraStream } from './camera.controller';

class FakeCameraResponse extends EventEmitter {
  statusCode: number;
  headers: Record<string, string>;
  constructor(statusCode = 200, headers: Record<string, string> = {}) {
    super();
    this.statusCode = statusCode;
    this.headers = headers;
  }
  resume = vi.fn();
  pipe = vi.fn();
}

class FakeRequest extends EventEmitter {
  destroy = vi.fn();
}

describe('Camera Controller', () => {
  let req: Partial<Request> & EventEmitter;
  let res: Partial<Response>;

  beforeEach(() => {
    req = Object.assign(new EventEmitter(), { params: {} }) as Partial<Request> & EventEmitter;
    res = {
      status: vi.fn().mockReturnThis() as unknown as Response['status'],
      json: vi.fn() as unknown as Response['json'],
      setHeader: vi.fn() as unknown as Response['setHeader'],
      flushHeaders: vi.fn() as unknown as Response['flushHeaders'],
      headersSent: false,
    };
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('should return 404 when the camera id is unknown', () => {
    req.params = { cameraId: 'unknown_camera' };

    getCameraStream(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Camera not found',
      code: 'CAMERA_NOT_FOUND',
    });
    expect(mockHttpGet).not.toHaveBeenCalled();
  });

  it('should pipe the upstream MJPEG stream to the response on success', () => {
    req.params = { cameraId: 'camera_1' };
    const fakeRequest = new FakeRequest();
    const fakeCameraRes = new FakeCameraResponse(200, {
      'content-type': 'multipart/x-mixed-replace',
    });

    mockHttpGet.mockImplementation((_url, _opts, callback) => {
      callback(fakeCameraRes);
      return fakeRequest;
    });

    getCameraStream(req as Request, res as Response);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'multipart/x-mixed-replace');
    expect(res.flushHeaders).toHaveBeenCalled();
    expect(fakeCameraRes.pipe).toHaveBeenCalledWith(res);
  });

  it("should default the Content-Type header when upstream doesn't provide one", () => {
    req.params = { cameraId: 'camera_1' };
    const fakeRequest = new FakeRequest();
    const fakeCameraRes = new FakeCameraResponse(200, {});

    mockHttpGet.mockImplementation((_url, _opts, callback) => {
      callback(fakeCameraRes);
      return fakeRequest;
    });

    getCameraStream(req as Request, res as Response);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'multipart/x-mixed-replace; boundary=--myboundary',
    );
  });

  it('should return 503 when the upstream camera responds with an error status', () => {
    req.params = { cameraId: 'camera_1' };
    const fakeRequest = new FakeRequest();
    const fakeCameraRes = new FakeCameraResponse(500, {});

    mockHttpGet.mockImplementation((_url, _opts, callback) => {
      callback(fakeCameraRes);
      return fakeRequest;
    });

    getCameraStream(req as Request, res as Response);

    expect(fakeCameraRes.resume).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ message: 'Camera error', code: 'CAMERA_ERROR' });
  });

  it('should not send a response for the upstream error if headers were already sent', () => {
    req.params = { cameraId: 'camera_1' };
    const fakeRequest = new FakeRequest();
    const fakeCameraRes = new FakeCameraResponse(500, {});
    res.headersSent = true;

    mockHttpGet.mockImplementation((_url, _opts, callback) => {
      callback(fakeCameraRes);
      return fakeRequest;
    });

    getCameraStream(req as Request, res as Response);

    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 503 when the upstream request errors out', () => {
    req.params = { cameraId: 'camera_1' };
    const fakeRequest = new FakeRequest();

    mockHttpGet.mockImplementation(() => fakeRequest);

    getCameraStream(req as Request, res as Response);
    fakeRequest.emit('error', new Error('ECONNREFUSED'));

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Camera unreachable',
      code: 'CAMERA_UNREACHABLE',
    });
  });

  it('should not send a response on request error if headers were already sent', () => {
    req.params = { cameraId: 'camera_1' };
    const fakeRequest = new FakeRequest();
    res.headersSent = true;

    mockHttpGet.mockImplementation(() => fakeRequest);

    getCameraStream(req as Request, res as Response);
    fakeRequest.emit('error', new Error('ECONNREFUSED'));

    expect(res.status).not.toHaveBeenCalled();
  });

  it('should destroy the upstream request when the client closes the connection', () => {
    req.params = { cameraId: 'camera_1' };
    const fakeRequest = new FakeRequest();

    mockHttpGet.mockImplementation(() => fakeRequest);

    getCameraStream(req as Request, res as Response);
    req.emit('close');

    expect(fakeRequest.destroy).toHaveBeenCalled();
  });

  it('should destroy the upstream request on timeout', () => {
    req.params = { cameraId: 'camera_1' };
    const fakeRequest = new FakeRequest();

    mockHttpGet.mockImplementation(() => fakeRequest);

    getCameraStream(req as Request, res as Response);
    fakeRequest.emit('timeout');

    expect(fakeRequest.destroy).toHaveBeenCalled();
  });
});
