import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockVehicleFind = vi.fn();
const mockUserFind = vi.fn();
const mockSendVehicleReminder = vi.fn();

vi.mock('../../models/vehicle.model', () => ({
  __esModule: true,
  default: {
    find: (...args: unknown[]) => mockVehicleFind(...args),
  },
}));

vi.mock('../../models/user.model', () => ({
  __esModule: true,
  default: {
    find: (...args: unknown[]) => mockUserFind(...args),
  },
}));

vi.mock('../../utils/mailer/mailer', () => ({
  sendVehicleReminder: (...args: unknown[]) => mockSendVehicleReminder(...args),
}));

import { checkAndSendVehicleReminders } from './reminderVehicle.service';

describe('Reminder Vehicle Service', () => {
  const mockDate = new Date('2026-04-23');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // #region No superadmins
  describe('checkAndSendVehicleReminders', () => {
    it('should return empty array and warn when no superadmins found', async () => {
      mockUserFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      });

      const result = await checkAndSendVehicleReminders();

      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith(
        '[Reminder] No superadmin found to send reminders to',
      );
    });

    // #region Find vehicles and check reminders
    it('should detect and send revision reminder at 30 days', async () => {
      // serviceDate is the last service date, next service = serviceDate + 365 days
      // If today is 2026-04-23, then next service should be 30 days from now = 2026-05-23
      // So serviceDate should be: 2026-05-23 - 365 = 2025-05-23
      const lastRevisionDate = new Date('2025-05-23');

      mockUserFind.mockReturnValue({
        lean: vi
          .fn()
          .mockResolvedValue([{ _id: 'admin1', email: 'admin@test.com', username: 'admin' }]),
      });

      mockVehicleFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'v1',
            brand: 'peugeot',
            model: '3008',
            licensePlate: 'AB-123-CD',
            serviceDate: lastRevisionDate,
            inspectionExpiryDate: null,
            antiPollutionExpiryDate: null,
          },
        ]),
      });

      mockSendVehicleReminder.mockResolvedValue(undefined);

      const result = await checkAndSendVehicleReminders();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        vehicleId: 'v1',
        licensePlate: 'AB-123-CD',
        type: 'revision',
        daysUntilDue: 30,
        reminderType: '1_month',
      });
      expect(mockSendVehicleReminder).toHaveBeenCalled();
    });
    // #endregion

    it('should detect and send CT reminder at 7 days', async () => {
      const ctDate = new Date('2026-04-30'); // 7 days from now

      mockUserFind.mockReturnValue({
        lean: vi
          .fn()
          .mockResolvedValue([{ _id: 'admin1', email: 'admin@test.com', username: 'admin' }]),
      });

      mockVehicleFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'v2',
            brand: 'renault',
            model: 'megane',
            licensePlate: 'EF-456-GH',
            serviceDate: null,
            inspectionExpiryDate: ctDate,
            antiPollutionExpiryDate: null,
          },
        ]),
      });

      mockSendVehicleReminder.mockResolvedValue(undefined);

      const result = await checkAndSendVehicleReminders();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        vehicleId: 'v2',
        licensePlate: 'EF-456-GH',
        type: 'ct',
        daysUntilDue: 7,
        reminderType: '1_week',
      });
    });

    it('should detect and send anti-pollution reminder at 0 days', async () => {
      const todayDate = new Date('2026-04-23');

      mockUserFind.mockReturnValue({
        lean: vi
          .fn()
          .mockResolvedValue([{ _id: 'admin1', email: 'admin@test.com', username: 'admin' }]),
      });

      mockVehicleFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'v3',
            brand: 'ford',
            model: 'focus',
            licensePlate: 'IJ-789-KL',
            serviceDate: null,
            inspectionExpiryDate: null,
            antiPollutionExpiryDate: todayDate,
          },
        ]),
      });

      mockSendVehicleReminder.mockResolvedValue(undefined);

      const result = await checkAndSendVehicleReminders();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        vehicleId: 'v3',
        licensePlate: 'IJ-789-KL',
        type: 'anti_pollution',
        daysUntilDue: 0,
        reminderType: 'jour_du_controle',
      });
    });

    it('should ignore reminders not at exact 0, 7, 30 days', async () => {
      const notMatchDate = new Date('2026-04-25'); // 2 days later

      mockUserFind.mockReturnValue({
        lean: vi
          .fn()
          .mockResolvedValue([{ _id: 'admin1', email: 'admin@test.com', username: 'admin' }]),
      });

      mockVehicleFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'v4',
            brand: 'citroen',
            model: 'c5',
            licensePlate: 'MN-111-OP',
            serviceDate: notMatchDate,
            inspectionExpiryDate: null,
            antiPollutionExpiryDate: null,
          },
        ]),
      });

      const result = await checkAndSendVehicleReminders();

      expect(result).toHaveLength(0);
      expect(mockSendVehicleReminder).not.toHaveBeenCalled();
    });

    it('should send reminders to all superadmins', async () => {
      const ctDate = new Date('2026-04-30');

      mockUserFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: 'admin1', email: 'admin1@test.com', username: 'admin1' },
          { _id: 'admin2', email: 'admin2@test.com', username: 'admin2' },
        ]),
      });

      mockVehicleFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'v5',
            brand: 'tesla',
            model: 'model3',
            licensePlate: 'QR-222-ST',
            serviceDate: null,
            inspectionExpiryDate: ctDate,
            antiPollutionExpiryDate: null,
          },
        ]),
      });

      mockSendVehicleReminder.mockResolvedValue(undefined);

      const result = await checkAndSendVehicleReminders();

      expect(result).toHaveLength(1);
      // Two emails sent (one per superadmin)
      expect(mockSendVehicleReminder).toHaveBeenCalledTimes(2);
      expect(mockSendVehicleReminder).toHaveBeenCalledWith('admin1@test.com', {
        vehicleName: expect.stringContaining('QR-222-ST'),
        daysUntil: 7,
        dueDate: ctDate,
        type: 'ct',
      });
      expect(mockSendVehicleReminder).toHaveBeenCalledWith('admin2@test.com', {
        vehicleName: expect.stringContaining('QR-222-ST'),
        daysUntil: 7,
        dueDate: ctDate,
        type: 'ct',
      });
    });

    it('should handle mailer errors gracefully', async () => {
      const ctDate = new Date('2026-04-30');

      mockUserFind.mockReturnValue({
        lean: vi
          .fn()
          .mockResolvedValue([{ _id: 'admin1', email: 'admin@test.com', username: 'admin' }]),
      });

      mockVehicleFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'v6',
            brand: 'volvo',
            model: 'xc90',
            licensePlate: 'UV-333-WX',
            serviceDate: null,
            inspectionExpiryDate: ctDate,
            antiPollutionExpiryDate: null,
          },
        ]),
      });

      mockSendVehicleReminder.mockRejectedValue(new Error('Email service down'));

      const result = await checkAndSendVehicleReminders();

      expect(result).toHaveLength(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[Reminder] Error sending inspection reminder'),
        expect.any(Error),
      );
    });

    it('should detect multiple reminders for same vehicle', async () => {
      const lastRevisionDate = new Date('2025-05-23');
      const ctExpirationDate = new Date('2026-04-30');

      mockUserFind.mockReturnValue({
        lean: vi
          .fn()
          .mockResolvedValue([{ _id: 'admin1', email: 'admin@test.com', username: 'admin' }]),
      });

      mockVehicleFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'v7',
            brand: 'audi',
            model: 'a4',
            licensePlate: 'YZ-444-AB',
            serviceDate: lastRevisionDate,
            inspectionExpiryDate: ctExpirationDate,
            antiPollutionExpiryDate: null,
          },
        ]),
      });

      mockSendVehicleReminder.mockResolvedValue(undefined);

      const result = await checkAndSendVehicleReminders();

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('revision');
      expect(result[0].reminderType).toBe('1_month');
      expect(result[1].type).toBe('ct');
      expect(result[1].reminderType).toBe('1_week');
    });
  });
  // #endregion
});
