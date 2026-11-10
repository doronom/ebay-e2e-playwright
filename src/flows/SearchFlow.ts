import { expect } from '@playwright/test';
import { config } from '@config/env';
import type { HomePage } from '@pages/HomePage';
import type { SearchResultsPage } from '@pages/SearchResultsPage';
import { attachJson } from '@utils/attachments';
import type { Logger } from '@utils/logger';
import type { CollectedItem } from '../types';

export class SearchFlow {
  constructor(
    private readonly homePage: HomePage,
    private readonly searchResultsPage: SearchResultsPage,
    private readonly currency: string,
    private readonly logger: Logger,
  ) {}

  searchItemsByNameUnderPrice(query: string, maxPrice: number, limit = 5): Promise<string[]> {
    return this.logger.step(`Search "${query}" for ${limit} items up to ${this.currency} ${maxPrice}`, async () => {
      await this.homePage.header.searchFor(query);
      await this.searchResultsPage.priceFilter.applyMax(maxPrice);

      const items = new Map<string, CollectedItem>();
      let pages = 1;
      for (; ; pages++) {
        for (const item of await this.searchResultsPage.collectItems(maxPrice, this.currency, limit - items.size)) {
          if (!items.has(item.url)) items.set(item.url, item);
        }
        if (items.size >= limit || !(await this.searchResultsPage.pagination.hasNext())) break;
        if (pages === config.maxSearchPages) {
          this.logger.warn(`stopped at page ${pages}: ${items.size}/${limit} items`);
          break;
        }
        await this.searchResultsPage.goToNextPage();
      }

      const collected = [...items.values()];
      await attachJson('collected-items.json', collected);
      this.logger.info(`pages: ${pages}, items: ${collected.length}/${limit}`);
      for (const item of collected) {
        expect(item.price.currency, `currency of ${item.url}`).toBe(this.currency);
      }
      return collected.map((item) => item.url);
    });
  }

  expectNoResults() {
    return this.searchResultsPage.expectNoResults();
  }
}
