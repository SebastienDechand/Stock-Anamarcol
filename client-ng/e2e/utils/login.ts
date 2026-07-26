import { Page } from '@playwright/test';

export const E2E_USER = { email: 'e2e@test.com', password: 'e2e-password' };

export async function login(page: Page, user = E2E_USER): Promise<void> {
  await page.goto('/');
  await page.getByLabel('Adresse e-mail').fill(user.email);
  await page.getByLabel('Mot de passe').fill(user.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL(/\/home$/);
}

