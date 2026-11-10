import type { Page } from '@playwright/test';
import { config } from '@config/env';
import { botCheckLocators } from '@pages/locators/botCheck.locators';
import { attachScreenshot } from './attachments';

export class BotCheckError extends Error {
  name = 'BotCheckError';
}

export const matchesBotCheck = ({ url, title, status }: { url: string; title: string; status?: number }) =>
  status === 403 || url.includes('/splashui/') || /Pardon Our Interruption|^Error Page \| eBay$/.test(title);

export async function isBotCheck(page: Page, status?: number) {
  if (matchesBotCheck({ url: page.url(), title: await page.title(), status })) return true;
  for (const frame of page.frames()) {
    const headings = await botCheckLocators(frame)
      .verifyYourselfHeading.count()
      .catch(() => 0);
    if (headings > 0) return true;
  }
  return false;
}

export async function assertNoBotCheck(page: Page, status?: number) {
  if (!(await isBotCheck(page, status))) return;

  await attachScreenshot(page, 'bot-check.png');
  if (config.pauseOnCaptcha && !config.headless) {
    await page.pause();
    if (!(await isBotCheck(page))) return;
  }
  const httpStatus = status === undefined ? '' : ` (HTTP ${status})`;
  throw new BotCheckError(`bot check: "${await page.title()}"${httpStatus} at ${page.url()}`);
}
