import { test, expect } from '@playwright/test';
import { login } from './utils/login';

const CLIENT_NAME = `Client${Date.now()}`;

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('creates a shipment and marks it as sent', async ({ page }) => {
  await page.goto('/shipments');

  await page.getByRole('button', { name: 'Nouvel envoi' }).click();
  await page.getByPlaceholder('ex : MARTIN').fill(CLIENT_NAME);
  await page.getByPlaceholder('ex : Sophie').fill('Jean');
  await page.getByPlaceholder('ex : 7 avenue Mozart').fill('1 rue de la Paix');
  await page.getByPlaceholder('ex : 75016').fill('75000');
  await page.getByPlaceholder('ex : Paris').fill('Paris');
  await page.getByPlaceholder('ex : Boulangerie Raybaud').fill('SARL Test');
  await page.getByPlaceholder('ex : Raison sociale…').fill('Gérant');
  await page.getByPlaceholder('ex : Hooper, rouleau TPE…').fill('Cassette CashGuard');
  await page.getByRole('button', { name: "Créer l'envoi" }).click();

  const row = page.locator('table.shipments-table tbody tr').filter({ hasText: CLIENT_NAME });
  await expect(row).toBeVisible();
  await expect(row.getByText('En attente')).toBeVisible();

  await row.getByRole('button', { name: 'Marquer comme envoyé' }).click();
  await expect(row.getByText('Envoyé')).toBeVisible();
});
