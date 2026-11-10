import { expect, test } from '@playwright/test';
import { matchesBotCheck } from '@utils/botCheck';

const ok = { url: 'https://www.ebay.com/sch/i.html?_nkw=shoes', title: 'Shoes for sale | eBay' };

test('a normal page with HTTP 200 is not a bot check', () => {
  expect(matchesBotCheck({ ...ok, status: 200 })).toBe(false);
});

test('a normal page without a response status is not a bot check', () => {
  expect(matchesBotCheck(ok)).toBe(false);
});

test('the eBay error page without a 403 is a bot check', () => {
  expect(matchesBotCheck({ ...ok, title: 'Error Page | eBay', status: 200 })).toBe(true);
});

test('"Pardon Our Interruption" is a bot check', () => {
  expect(matchesBotCheck({ ...ok, title: 'Pardon Our Interruption...' })).toBe(true);
});

test('a /splashui/ URL is a bot check', () => {
  expect(matchesBotCheck({ ...ok, url: 'https://www.ebay.com/splashui/challenge?ap=1' })).toBe(true);
});

test('HTTP 403 is a bot check even with a normal title', () => {
  expect(matchesBotCheck({ ...ok, status: 403 })).toBe(true);
});

test('other error statuses are not treated as bot checks', () => {
  expect(matchesBotCheck({ ...ok, status: 404 })).toBe(false);
  expect(matchesBotCheck({ ...ok, status: 500 })).toBe(false);
});

test('a title that only contains "Error Page" is not a bot check', () => {
  expect(matchesBotCheck({ ...ok, title: 'Error Page | eBay community thread' })).toBe(false);
});
