import { test, expect } from '@playwright/test';
import { login } from './utils/login';

const PLATE = 'zz-999-zz';
const PLATE_FORMATTED = 'ZZ-999-ZZ';

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('enforces the brand/model guard, creates a vehicle, and deletes it', async ({ page }) => {
  await page.goto('/fleet');

  await page.getByRole('button', { name: 'Ajouter un véhicule' }).click();

  // Switching brand to Nissan should restrict the model dropdown to Navara
  // only (client-side guard, no invalid combination is even selectable).
  await page.locator('.form-group').filter({ hasText: 'Marque' }).locator('select').selectOption({
    label: 'Nissan',
  });
  const modelOptions = page
    .locator('.form-group')
    .filter({ hasText: 'Modèle' })
    .locator('select option');
  await expect(modelOptions).toHaveCount(1);
  await expect(modelOptions).toHaveText(['Navara']);

  await page.getByPlaceholder('AB-123-CD').fill(PLATE);
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click();

  const row = page.locator('table.vehicles-table tr').filter({ hasText: PLATE_FORMATTED });
  await expect(row).toBeVisible();

  await row.getByRole('button', { name: 'Supprimer' }).click();
  await page.locator('.confirm-actions').getByRole('button', { name: 'Supprimer' }).click();

  await expect(row).not.toBeVisible();
});
