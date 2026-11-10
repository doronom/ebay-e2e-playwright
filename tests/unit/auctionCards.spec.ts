import { expect, test } from '@playwright/test';
import { AUCTION_BID_TEXT } from '@pages/locators/searchResults.locators';

for (const text of ['1 bid', '0 bids', '12 bids · 2d 4h left', 'ILS 45.00 3 Bids', 'US $10.00\n5 bids']) {
  test(`treats "${text.replace('\n', ' ')}" as an auction card`, () => {
    expect(AUCTION_BID_TEXT.test(text)).toBe(true);
  });
}

for (const text of [
  'ILS 120.00 Buy It Now',
  'ILS 80.00 or Best Offer',
  'Only 2 left',
  'Free shipping',
  'Morbid Angel t-shirt',
  'Forbidden bidet seat 2 pack',
]) {
  test(`treats "${text}" as a fixed-price card`, () => {
    expect(AUCTION_BID_TEXT.test(text)).toBe(false);
  });
}
