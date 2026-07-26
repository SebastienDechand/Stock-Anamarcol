import { describe, it, expect, vi } from 'vitest';

const mockClientFileModel = vi.hoisted(() => ({
  find: vi.fn(),
  findById: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  findByIdAndDelete: vi.fn(),
}));

vi.mock('../../models/clientFile.model', () => ({
  __esModule: true,
  default: mockClientFileModel,
}));

import {
  listClientFiles,
  findClientFileById,
  findClientFileDocument,
  findClientFileBySiretAndAddress,
  findClientFileByNameAndAddress,
  createClientFile,
  deleteClientFileById,
} from './clientFile.service';

describe('clientFile.service', () => {
  it('listClientFiles sorts, populates and leans', async () => {
    const files = [{ _id: 'f1' }];
    const lean = vi.fn().mockResolvedValue(files);
    const populate = vi.fn().mockReturnValue({ lean });
    const sort = vi.fn().mockReturnValue({ populate });
    mockClientFileModel.find.mockReturnValue({ sort });

    const result = await listClientFiles();

    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(populate).toHaveBeenCalledWith('contactRef', 'name email phone');
    expect(result).toBe(files);
  });

  it('findClientFileById populates and leans', async () => {
    const file = { _id: 'f1' };
    const lean = vi.fn().mockResolvedValue(file);
    const populate = vi.fn().mockReturnValue({ lean });
    mockClientFileModel.findById.mockReturnValue({ populate });

    const result = await findClientFileById('f1');

    expect(mockClientFileModel.findById).toHaveBeenCalledWith('f1');
    expect(result).toBe(file);
  });

  it('findClientFileDocument returns the raw findById query', () => {
    const doc = { _id: 'f1' };
    mockClientFileModel.findById.mockReturnValue(doc);
    expect(findClientFileDocument('f1')).toBe(doc);
  });

  it('findClientFileBySiretAndAddress builds a case-insensitive address match', async () => {
    const lean = vi.fn().mockResolvedValue(null);
    mockClientFileModel.findOne.mockReturnValue({ lean });

    await findClientFileBySiretAndAddress('12345', '1 rue de la Paix');

    expect(mockClientFileModel.findOne).toHaveBeenCalledWith({
      siret: '12345',
      address: { $regex: '^1 rue de la Paix$', $options: 'i' },
    });
  });

  it('findClientFileByNameAndAddress builds case-insensitive matches', async () => {
    const lean = vi.fn().mockResolvedValue(null);
    mockClientFileModel.findOne.mockReturnValue({ lean });

    await findClientFileByNameAndAddress('Dupont', '1 rue de la Paix');

    expect(mockClientFileModel.findOne).toHaveBeenCalledWith({
      lastName: { $regex: '^Dupont$', $options: 'i' },
      address: { $regex: '^1 rue de la Paix$', $options: 'i' },
    });
  });

  it('createClientFile delegates to the model', async () => {
    const data = { lastName: 'Dupont' };
    mockClientFileModel.create.mockResolvedValue({ _id: 'f1', ...data });
    const result = await createClientFile(data);
    expect(mockClientFileModel.create).toHaveBeenCalledWith(data);
    expect(result).toEqual({ _id: 'f1', ...data });
  });

  it('deleteClientFileById delegates to findByIdAndDelete', async () => {
    mockClientFileModel.findByIdAndDelete.mockResolvedValue({ _id: 'f1' });
    const result = await deleteClientFileById('f1');
    expect(mockClientFileModel.findByIdAndDelete).toHaveBeenCalledWith('f1');
    expect(result).toEqual({ _id: 'f1' });
  });
});
