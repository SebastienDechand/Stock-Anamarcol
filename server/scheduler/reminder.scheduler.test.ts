import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockCronSchedule = vi.hoisted(() => vi.fn());
const mockCheckAndSendVehicleReminders = vi.hoisted(() => vi.fn());

vi.mock('node-cron', () => ({
  __esModule: true,
  default: { schedule: mockCronSchedule },
}));

vi.mock('../services/reminderVehicle/reminderVehicle.service', () => ({
  checkAndSendVehicleReminders: mockCheckAndSendVehicleReminders,
}));

import { startReminderScheduler } from './reminder.scheduler';

describe('reminder.scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('schedules the daily job at 08:00 Europe/Paris', () => {
    startReminderScheduler();

    expect(mockCronSchedule).toHaveBeenCalledWith('0 8 * * *', expect.any(Function), {
      timezone: 'Europe/Paris',
    });
    expect(console.log).toHaveBeenCalledWith(
      '[Scheduler] Vehicle reminders enabled (every day at 08:00 CET)',
    );
  });

  it('logs the count when the scheduled job sends reminders', async () => {
    startReminderScheduler();
    const job = mockCronSchedule.mock.calls[0][1] as () => Promise<void>;
    mockCheckAndSendVehicleReminders.mockResolvedValue([{ vehicleId: 'v1' }, { vehicleId: 'v2' }]);

    await job();

    expect(console.log).toHaveBeenCalledWith('[Scheduler] 2 reminder(s) sent successfully');
  });

  it("logs 'no reminders' when the job finds nothing to send", async () => {
    startReminderScheduler();
    const job = mockCronSchedule.mock.calls[0][1] as () => Promise<void>;
    mockCheckAndSendVehicleReminders.mockResolvedValue([]);

    await job();

    expect(console.log).toHaveBeenCalledWith('[Scheduler] No reminders to send today');
  });

  it('logs the error instead of throwing when the check fails', async () => {
    startReminderScheduler();
    const job = mockCronSchedule.mock.calls[0][1] as () => Promise<void>;
    const error = new Error('DB down');
    mockCheckAndSendVehicleReminders.mockRejectedValue(error);

    await expect(job()).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledWith(
      '[Scheduler] Error while checking reminders:',
      error,
    );
  });
});
