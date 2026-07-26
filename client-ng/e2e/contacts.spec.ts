import { test, expect } from '@playwright/test';
import { login } from './utils/login';

const CONTACT_NAME = `Contact E2E ${Date.now()}`;

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('edits a contact and sees the change reflected in the list', async ({ page }) => {
  // No "create contact" UI exists yet (contacts-page only supports editing) -
  // seed one directly via the real API, reusing the browser's session cookie.
  await page.request.post('/api/contacts/', {
    data: { name: CONTACT_NAME, category: 'external' },
  });

  await page.goto('/contacts');
  const card = page.locator('.contact-card').filter({ hasText: CONTACT_NAME });
  await expect(card).toBeVisible();

  await card.click();
  const updatedName = `${CONTACT_NAME} modifié`;
  await page.locator('.form-row').filter({ hasText: 'Nom' }).getByRole('textbox').fill(updatedName);
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page.locator('.contact-card').filter({ hasText: updatedName })).toBeVisible();
});
