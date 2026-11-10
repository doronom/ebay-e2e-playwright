import { expect, type Page } from '@playwright/test';
import { headerLocators } from '@pages/locators/header.locators';
import { assertNoBotCheck } from '@utils/botCheck';
import type { Logger } from '@utils/logger';

export class Header {
  private readonly locators: ReturnType<typeof headerLocators>;

  constructor(
    private readonly page: Page,
    private readonly logger: Logger,
  ) {
    this.locators = headerLocators(page);
  }

  async dismissShippingPrompt() {
    await this.page.addLocatorHandler(this.locators.shippingDialog, async () => {
      this.logger.info('dismissed shipping prompt');
      await this.locators.shippingDialogDismiss.click();
    });
  }

  searchFor(query: string) {
    return this.logger.step(`Search for "${query}"`, async () => {
      await this.locators.searchInput.fill(query);
      await this.locators.searchButton.click();
      await this.page.waitForURL(
        (url) =>
          url.pathname.includes('/splashui/') ||
          (url.pathname.startsWith('/sch/') && url.searchParams.get('_nkw') === query),
        { waitUntil: 'domcontentloaded' },
      );
      await assertNoBotCheck(this.page);
    });
  }

  async expectSignedIn() {
    await expect(this.locators.root, 'header visible').toBeVisible();
    await expect(this.locators.signInLink, 'no Sign in link').toHaveCount(0);
  }
}
