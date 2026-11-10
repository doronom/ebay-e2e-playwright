import type { Page } from '@playwright/test';
import { searchResultsLocators } from '@pages/locators/searchResults.locators';
import { assertNoBotCheck } from '@utils/botCheck';
import type { Logger } from '@utils/logger';

export class PriceFilter {
  private readonly locators: ReturnType<typeof searchResultsLocators>;

  constructor(
    private readonly page: Page,
    private readonly logger: Logger,
  ) {
    this.locators = searchResultsLocators(page);
  }

  applyMax(maxPrice: number) {
    return this.logger.step(`Max price ${maxPrice}`, async () => {
      if (!(await this.locators.maxPriceInput.isVisible())) {
        this.logger.warn('no price filter, using card prices');
        return;
      }
      await this.locators.maxPriceInput.fill(String(maxPrice));
      await this.locators.maxPriceInput.press('Enter');
      await this.page.waitForURL(
        (url) => url.pathname.includes('/splashui/') || Number(url.searchParams.get('_udhi')) === maxPrice,
        { waitUntil: 'domcontentloaded' },
      );
      await assertNoBotCheck(this.page);
    });
  }
}
