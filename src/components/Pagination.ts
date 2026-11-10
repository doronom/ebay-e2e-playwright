import type { Page } from '@playwright/test';
import { searchResultsLocators } from '@pages/locators/searchResults.locators';
import { assertNoBotCheck } from '@utils/botCheck';

export class Pagination {
  private readonly locators: ReturnType<typeof searchResultsLocators>;

  constructor(private readonly page: Page) {
    this.locators = searchResultsLocators(page);
  }

  currentPage() {
    return Number(new URL(this.page.url()).searchParams.get('_pgn') ?? 1);
  }

  async hasNext() {
    return (await this.locators.nextPageLink.count()) > 0;
  }

  async next() {
    const target = this.currentPage() + 1;
    await this.locators.nextPageLink.first().click();
    await this.page.waitForURL(
      (url) => url.pathname.includes('/splashui/') || Number(url.searchParams.get('_pgn')) === target,
      { waitUntil: 'domcontentloaded' },
    );
    await assertNoBotCheck(this.page);
  }
}
