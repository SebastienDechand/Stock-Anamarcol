import { test, expect } from '@playwright/test';
import { login } from './utils/login';

test('logs in, reaches the dashboard, and logs back out', async ({ page }) => {
  await login(page);

  await expect(page.getByText('e2e_admin')).toBeVisible();

  await page.getByRole('button', { name: 'Ouvrir le menu du compte' }).click();
  await page.getByRole('menuitem', { name: 'Déconnexion' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
});
