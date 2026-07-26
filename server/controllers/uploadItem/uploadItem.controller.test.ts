import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';

const mockItemModel = vi.hoisted(() => ({
  findByIdAndUpdate: vi.fn(),
}));

vi.mock('../../models/item.model', () => ({
  __esModule: true,
  default: mockItemModel,
}));

vi.mock('../../utils/upload/upload.utils', () => ({
  validateUploadedFile: vi.fn(),
  uploadToImgBB: vi.fn(),
}));

import { uploadItem } from './uploadItem.controller';
import { validateUploadedFile, uploadToImgBB } from '../../utils/upload/upload.utils';

describe('UploadItem Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: { name: 'item1', supplier: 'Oxhoo', status: 'NEW', itemId: '507f1f77bcf86cd799439011' },
      file: { buffer: Buffer.from('fake') } as Express.Multer.File,
    };
    res = {
      status: vi.fn().mockReturnThis() as unknown as Response['status'],
      json: vi.fn() as unknown as Response['json'],
    };
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('should stop early when the file is invalid', async () => {
    (validateUploadedFile as ReturnType<typeof vi.fn>).mockReturnValue(false);

    await uploadItem(req as Request, res as Response);

    expect(uploadToImgBB).not.toHaveBeenCalled();
  });

  it('should return 400 when itemId is not a valid ObjectId', async () => {
    (validateUploadedFile as ReturnType<typeof vi.fn>).mockReturnValue(true);
    req.body.itemId = 'not-an-id';

    await uploadItem(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(uploadToImgBB).not.toHaveBeenCalled();
  });

  it('should upload the picture using a name built from name+supplier+status, update the item and return it', async () => {
    (validateUploadedFile as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (uploadToImgBB as ReturnType<typeof vi.fn>).mockResolvedValue('https://img/item.jpg');
    const updatedItem = { _id: '507f1f77bcf86cd799439011', image: 'https://img/item.jpg' };
    mockItemModel.findByIdAndUpdate.mockResolvedValue(updatedItem);

    await uploadItem(req as Request, res as Response);

    expect(uploadToImgBB).toHaveBeenCalledWith(req.file!.buffer, 'item1OxhooNEW.jpg');
    expect(mockItemModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { $set: { image: 'https://img/item.jpg' } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    expect(res.json).toHaveBeenCalledWith(updatedItem);
  });

  it('should return 500 on unexpected error', async () => {
    (validateUploadedFile as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (uploadToImgBB as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('ImgBB down'));

    await uploadItem(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
