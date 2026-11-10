import type { Route } from '@playwright/test';
import { BotCheckError } from '@utils/botCheck';
import { expect, test } from '@fixtures/index';

const errorPage = '<html><head><title>Error Page | eBay</title></head><body>Access denied</body></html>';
const verifyPage =
  '<html><head><title>Sign in or Register | eBay</title></head><body><h1>Sign in to your account</h1>' +
  '<iframe srcdoc="<h1>Please verify yourself to continue</h1>"></iframe></body></html>';

const serveEbayPages = (status: number, body: string) => (route: Route) => {
  const request = route.request();
  if (request.resourceType() === 'document' && new URL(request.url()).hostname === 'www.ebay.com') {
    return route.fulfill({ status, contentType: 'text/html', body });
  }
  return route.abort();
};

test.use({ headless: true, useSession: false });

test('stops on 403 error page', async ({ page, authFlow }) => {
  await page.route('**/*', serveEbayPages(403, errorPage));

  await expect(authFlow.login()).rejects.toThrow(BotCheckError);
});

test('stops on verify iframe', async ({ page, authFlow }) => {
  await page.route('**/*', serveEbayPages(200, verifyPage));

  await expect(authFlow.login()).rejects.toThrow(BotCheckError);
});
