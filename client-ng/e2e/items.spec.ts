import { test, expect } from '@playwright/test';
import { login } from './utils/login';

const ITEM_NAME = `Article E2E ${Date.now()}`;

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('creates an item, edits its quantity, and sees the change in the list', async ({ page }) => {
  await page.goto('/items');

  await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await page.locator('#name').fill(ITEM_NAME);
  await page.locator('#supplier').selectOption({ label: 'Amazon' });
  await page.locator('#status').selectOption({ label: 'NEW' });
  await page.locator('#qty').fill('5');
  await page.getByRole('button', { name: 'Ajouter un article' }).click();

  const card = page.locator('.item-card').filter({ hasText: ITEM_NAME });
  await expect(card).toBeVisible();
  await expect(card.locator('.qty-value')).toHaveText('5');

  await card.click();
  await page.getByRole('button', { name: 'Modifier' }).click();
  await page.locator('.field').filter({ hasText: 'Quantité' }).getByRole('spinbutton').fill('12');
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(card.locator('.qty-value')).toHaveText('12');
});
