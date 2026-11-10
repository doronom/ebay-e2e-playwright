import { expect } from '@playwright/test';
import { Pagination } from '@components/Pagination';
import { PriceFilter } from '@components/PriceFilter';
import { isWithinBudget, parsePriceIn } from '@utils/priceParser';
import type { CollectedItem } from '../types';
import { BasePage } from './BasePage';
import { searchResultsLocators } from './locators/searchResults.locators';
import { ProductPage } from './ProductPage';

const toItemUrl = (href: string) => {
  const url = new URL(href);
  return url.origin + url.pathname;
};

export class SearchResultsPage extends BasePage {
  readonly priceFilter = new PriceFilter(this.page, this.logger);
  readonly pagination = new Pagination(this.page);
  private readonly locators = searchResultsLocators(this.page);

  url() {
    return this.page.url();
  }

  expectNoResults() {
    return this.logger.step('No results', async () => {
      await expect(
        this.locators.zeroResultsHeading.or(this.locators.noExactMatchesBanner).first(),
        'no-results message',
      ).toBeVisible();
    });
  }

  collectItems(maxPrice: number, currency: string, needed: number) {
    const pageNumber = this.pagination.currentPage();
    return this.logger.step(`Collect items, page ${pageNumber}`, async () => {
      await expect(this.locators.resultsHeading).toBeVisible();
      const items: CollectedItem[] = [];
      for (const card of await this.locators.fixedPriceCards.all()) {
        if (items.length === needed) break;
        const price = parsePriceIn((await card.locator(this.locators.cardPrice).allTextContents()).join(' '), currency);
        const href = await card.locator(this.locators.cardLink).first().getAttribute('href');
        if (!price || !href || !isWithinBudget(price, maxPrice)) continue;
        const title = (await card.locator(this.locators.cardTitle).textContent())?.trim() ?? '';
        items.push({ url: toItemUrl(href), title, price, page: pageNumber });
      }
      return items;
    });
  }

  goToNextPage() {
    return this.logger.step('Next page', async () => {
      const firstBefore = String(await this.locators.resultCards.first().getAttribute('data-listingid'));
      await this.pagination.next();
      await expect(this.locators.resultCards.first()).not.toHaveAttribute('data-listingid', firstBefore);
    });
  }

  async openItem(url: string) {
    const productPage = new ProductPage(await this.page.context().newPage(), this.logger);
    await productPage.open(url);
    return productPage;
  }

  expectStillOn(url: string) {
    return this.logger.step('Back on results', async () => {
      await this.page.bringToFront();
      await expect(this.page).toHaveURL(url);
      await expect(this.locators.resultsHeading).toBeVisible();
    });
  }
}
