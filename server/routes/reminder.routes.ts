import { Router } from 'express';
import { sendVehicleReminders } from '../controllers/reminder/reminder.controller';
import { requireSuperAdmin } from '../middleware/auth/auth.middleware';

const router = Router();

/**
 * POST /api/reminders/vehicles/send
 * Triggers vehicle reminder emails. Requires SUPERADMIN role.
 */
router.post('/vehicles/send', requireSuperAdmin, sendVehicleReminders);

export default router;
