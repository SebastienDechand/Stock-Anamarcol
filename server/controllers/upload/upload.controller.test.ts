import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';

const mockUserModel = vi.hoisted(() => ({
  findByIdAndUpdate: vi.fn(),
}));

vi.mock('../../models/user.model', () => ({
  __esModule: true,
  default: mockUserModel,
}));

vi.mock('../../utils/upload/upload.utils', () => ({
  validateUploadedFile: vi.fn(),
  uploadToImgBB: vi.fn(),
}));

vi.mock('../../utils/audit/audit.utils', () => ({
  logEvent: vi.fn().mockResolvedValue(undefined),
}));

import { uploadProfil } from './upload.controller';
import { validateUploadedFile, uploadToImgBB } from '../../utils/upload/upload.utils';
import { logEvent } from '../../utils/audit/audit.utils';

describe('Upload Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: { name: 'user1', userId: '507f1f77bcf86cd799439011' },
      file: { buffer: Buffer.from('fake') } as Express.Multer.File,
    };
    res = {
      locals: { user: { username: 'admin' } },
      status: vi.fn().mockReturnThis() as unknown as Response['status'],
      json: vi.fn() as unknown as Response['json'],
    };
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('should stop early when the file is invalid', async () => {
    (validateUploadedFile as ReturnType<typeof vi.fn>).mockReturnValue(false);

    await uploadProfil(req as Request, res as Response);

    expect(uploadToImgBB).not.toHaveBeenCalled();
  });

  it('should return 400 when userId is not a valid ObjectId', async () => {
    (validateUploadedFile as ReturnType<typeof vi.fn>).mockReturnValue(true);
    req.body.userId = 'not-an-id';

    await uploadProfil(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(uploadToImgBB).not.toHaveBeenCalled();
  });

  it('should upload the picture, update the user, log the event and return it', async () => {
    (validateUploadedFile as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (uploadToImgBB as ReturnType<typeof vi.fn>).mockResolvedValue('https://img/pic.jpg');
    const updatedUser = { _id: '507f1f77bcf86cd799439011', picture: 'https://img/pic.jpg' };
    mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

    await uploadProfil(req as Request, res as Response);

    expect(uploadToImgBB).toHaveBeenCalledWith(req.file!.buffer, 'user1.jpg');
    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { $set: { picture: 'https://img/pic.jpg' } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    expect(logEvent).toHaveBeenCalledWith('upload', 'user', '507f1f77bcf86cd799439011', 'admin', {
      pictureUrl: 'https://img/pic.jpg',
    });
    expect(res.json).toHaveBeenCalledWith(updatedUser);
  });

  it('should still respond even if the audit log fails', async () => {
    (validateUploadedFile as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (uploadToImgBB as ReturnType<typeof vi.fn>).mockResolvedValue('https://img/pic.jpg');
    mockUserModel.findByIdAndUpdate.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
    (logEvent as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('audit down'));

    await uploadProfil(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011' });
  });

  it('should return 500 on unexpected error', async () => {
    (validateUploadedFile as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (uploadToImgBB as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('ImgBB down'));

    await uploadProfil(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });
});
