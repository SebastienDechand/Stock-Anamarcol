import { test, expect } from '@playwright/test';
import { login } from './utils/login';

const LAST_NAME = `Dupont${Date.now()}`;
const ADDRESS = '1 rue de la Paix';

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('creates a client file, blocks a duplicate, and edits it', async ({ page }) => {
  await page.goto('/client-files');

  await page.getByRole('button', { name: 'Nouvelle fiche' }).first().click();
  await page.getByPlaceholder('DUPONT').fill(LAST_NAME);
  await page
    .locator('.form-field')
    .filter({ hasText: 'Adresse' })
    .getByRole('textbox')
    .fill(ADDRESS);
  await page.getByRole('button', { name: 'Créer', exact: true }).click();

  const card = page.locator('.file-card').filter({ hasText: LAST_NAME.toUpperCase() });
  await expect(card).toBeVisible();
  await expect(card).toHaveCount(1);

  // The modal closes optimistically on submit either way (fire-and-forget
  // dispatch), so a rejected duplicate (409, same lastName + address) must
  // be verified by absence of a second card, not by the modal's own state.
  await page.getByRole('button', { name: 'Nouvelle fiche' }).first().click();
  await page.getByPlaceholder('DUPONT').fill(LAST_NAME);
  await page
    .locator('.form-field')
    .filter({ hasText: 'Adresse' })
    .getByRole('textbox')
    .fill(ADDRESS);
  const duplicateAttempt = page.waitForResponse(
    (res) => res.request().method() === 'POST' && res.url().endsWith('/api/client-files'),
  );
  await page.getByRole('button', { name: 'Créer', exact: true }).click();
  const duplicateResponse = await duplicateAttempt;
  expect(duplicateResponse.status()).toBe(409);
  await expect(card).toHaveCount(1);

  await card.getByRole('button', { name: 'Modifier' }).click();
  await page.locator('.form-field').filter({ hasText: 'Ville' }).getByRole('textbox').fill('Lyon');
  await page.getByRole('button', { name: 'Mettre à jour' }).click();

  await expect(card.getByText('Lyon')).toBeVisible();
});
