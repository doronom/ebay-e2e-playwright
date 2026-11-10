import { test, type Page } from '@playwright/test';

export async function attachScreenshot(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot(), contentType: 'image/png' });
}

export async function attachJson(name: string, data: unknown) {
  await test.info().attach(name, { body: JSON.stringify(data, null, 2), contentType: 'application/json' });
}
