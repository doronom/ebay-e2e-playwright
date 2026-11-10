import type { Page } from '@playwright/test';

export const AUCTION_BID_TEXT = /\b\d+\s+bids?\b/i;

const RESULT_CARDS =
  "xpath=//ul[contains(@class,'srp-results')]/li[@data-listingid][not(preceding-sibling::li[contains(@class,'srp-river-answer--REWRITE_START')])]";

const NOT_AUCTION =
  "[not(.//*[contains(@class,'time-left') or contains(@class,'__bids') or contains(@class,'bidCount')])]";

export const searchResultsLocators = (page: Page) => {
  const resultsHeading = page
    .locator('.srp-controls__count-heading')
    .or(page.getByRole('heading', { name: /results for/ }))
    .first();
  return {
    resultsHeading,
    zeroResultsHeading: resultsHeading.filter({ hasText: /^\s*0 results/ }),
    noExactMatchesBanner: page.getByText('No exact matches found', { exact: false }),
    resultCards: page.locator(RESULT_CARDS),
    fixedPriceCards: page.locator(RESULT_CARDS + NOT_AUCTION).filter({ hasNotText: AUCTION_BID_TEXT }),
    cardLink: "xpath=.//a[contains(@href,'/itm/')]",
    cardTitle: "xpath=.//div[contains(@class,'s-card__title')]/span[1]",
    cardPrice: "xpath=.//span[contains(@class,'s-card__price')]",
    maxPriceInput: page.getByRole('textbox', { name: /^Maximum Value/ }).first(),
    nextPageLink: page
      .getByRole('link', { name: 'Go to next search page' })
      .or(page.locator('a.pagination__next[href]'))
      .and(page.locator(':not([aria-disabled="true"])')),
  };
};
