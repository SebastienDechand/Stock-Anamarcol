import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockHistoryModel = vi.hoisted(() => ({ deleteMany: vi.fn() }));
const mockAuditModel = vi.hoisted(() => ({ deleteMany: vi.fn() }));

vi.mock('../../models/history.model', () => ({
  __esModule: true,
  default: mockHistoryModel,
}));
vi.mock('../../models/audit.model', () => ({
  __esModule: true,
  default: mockAuditModel,
}));

import { purgeOldEntries } from './purge.service';

describe('purge.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('deletes history and audit entries older than 60 days', async () => {
    mockHistoryModel.deleteMany.mockResolvedValue({ deletedCount: 3 });
    mockAuditModel.deleteMany.mockResolvedValue({ deletedCount: 2 });

    await purgeOldEntries();

    const expectedCutoff = new Date('2025-12-31T00:00:00.000Z');
    expect(mockHistoryModel.deleteMany).toHaveBeenCalledWith({
      createdAt: { $lt: expectedCutoff },
    });
    expect(mockAuditModel.deleteMany).toHaveBeenCalledWith({
      createdAt: { $lt: expectedCutoff },
    });
  });

  it('logs the total count when entries were deleted', async () => {
    mockHistoryModel.deleteMany.mockResolvedValue({ deletedCount: 3 });
    mockAuditModel.deleteMany.mockResolvedValue({ deletedCount: 2 });

    await purgeOldEntries();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('total: 5'));
  });

  it('does not log when nothing was deleted', async () => {
    mockHistoryModel.deleteMany.mockResolvedValue({ deletedCount: 0 });
    mockAuditModel.deleteMany.mockResolvedValue({ deletedCount: 0 });

    await purgeOldEntries();

    expect(console.log).not.toHaveBeenCalled();
  });

  it('swallows errors and logs them instead of throwing', async () => {
    mockHistoryModel.deleteMany.mockRejectedValue(new Error('DB down'));
    mockAuditModel.deleteMany.mockResolvedValue({ deletedCount: 0 });

    await expect(purgeOldEntries()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith('[Purge] Error:', expect.any(Error));
  });
});
