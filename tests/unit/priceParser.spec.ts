import { expect, test } from '@playwright/test';
import { isWithinBudget, parsePrice, parsePriceIn } from '@utils/priceParser';

const single = (value: number, currency: string) => ({ value, currency, isRange: false, min: value, max: value });

const parsed = [
  { text: '$1,234.56', expected: single(1234.56, 'USD') },
  { text: 'US $45.00', expected: single(45, 'USD') },
  { text: 'ILS 120.00', expected: single(120, 'ILS') },
  { text: '£12.99', expected: single(12.99, 'GBP') },
  { text: 'EUR 9,99', expected: single(9.99, 'EUR') },
  { text: 'EUR 1.234,56', expected: single(1234.56, 'EUR') },
  { text: '$30.00 or Best Offer', expected: single(30, 'USD') },
  { text: 'US $45.00 +$5.00 shipping', expected: single(45, 'USD') },
  { text: '$20.00 to $35.00', expected: { value: 20, currency: 'USD', isRange: true, min: 20, max: 35 } },
  {
    text: 'ILS 75.87  to  ILS 162.61',
    expected: { value: 75.87, currency: 'ILS', isRange: true, min: 75.87, max: 162.61 },
  },
  { text: '₪ 67.73', expected: single(67.73, 'ILS') },
  { text: 'US $21.24/ea', expected: single(21.24, 'USD') },
  { text: 'USB 3.0 cable ₪25.00', expected: single(25, 'ILS') },
  { text: '₪80.00 Was: ₪100.00', expected: single(80, 'ILS') },
];

for (const { text, expected } of parsed) {
  test(`parses "${text}"`, () => {
    expect(parsePrice(text)).toEqual(expected);
  });
}

for (const text of ['', 'Free shipping', '+$5.00 shipping', 'Price not available']) {
  test(`returns null for "${text}"`, () => {
    expect(parsePrice(text)).toBeNull();
  });
}

test('includes a price equal to the max price', () => {
  expect(isWithinBudget(single(220, 'USD'), 220)).toBe(true);
});

test('excludes a price one cent above the max price', () => {
  expect(isWithinBudget(single(220.01, 'USD'), 220)).toBe(false);
});

test('excludes a price range whose upper bound is above the max price', () => {
  expect(isWithinBudget({ value: 200, currency: 'USD', isRange: true, min: 200, max: 250 }, 220)).toBe(false);
});

test('includes a price range whose upper bound equals the max price', () => {
  expect(isWithinBudget({ value: 200, currency: 'USD', isRange: true, min: 200, max: 220 }, 220)).toBe(true);
});

test.describe('mixed currencies', () => {
  const mixed = 'US $50.00 (ILS 185.20)';

  test(`prefers the expected currency in "${mixed}"`, () => {
    expect(parsePrice(mixed, 'ILS')).toEqual(single(185.2, 'ILS'));
  });

  test(`returns the first currency of "${mixed}" when it is the expected one`, () => {
    expect(parsePrice(mixed, 'USD')).toEqual(single(50, 'USD'));
  });

  test(`falls back to the first currency of "${mixed}" when the expected one is missing`, () => {
    expect(parsePrice(mixed, 'EUR')).toEqual(single(50, 'USD'));
    expect(parsePrice(mixed)).toEqual(single(50, 'USD'));
  });

  test('reads a range in the expected currency only', () => {
    expect(parsePrice('US $20.00 to US $30.00 (ILS 74.00 to ILS 111.00)', 'ILS')).toEqual({
      value: 74,
      currency: 'ILS',
      isRange: true,
      min: 74,
      max: 111,
    });
  });

  test('does not mix currencies into a range', () => {
    expect(parsePrice('US $20.00 (ILS 74.00)')).toEqual(single(20, 'USD'));
  });

  test('ignores shipping after the price in the expected currency', () => {
    expect(parsePrice('Subtotal US $50.00 (ILS 185.20) +US $9.99 shipping', 'ILS')).toEqual(single(185.2, 'ILS'));
  });
});

test.describe('parsePriceIn', () => {
  test('returns the amount in the requested currency', () => {
    expect(parsePriceIn('US $50.00 Approximately ILS 185.20', 'ILS')).toEqual(single(185.2, 'ILS'));
  });

  test('reads "US $58.00 ApproximatelyILS 184.96" as ILS 184.96', () => {
    expect(parsePriceIn('US $58.00 ApproximatelyILS 184.96', 'ILS')).toEqual(single(184.96, 'ILS'));
  });

  test('reads "US $64.90or Best Offer ApproximatelyILS 206.97" as ILS 206.97', () => {
    expect(parsePriceIn('US $64.90or Best Offer ApproximatelyILS 206.97', 'ILS')).toEqual(single(206.97, 'ILS'));
  });

  test('returns null when the requested currency is not shown', () => {
    expect(parsePriceIn('US $50.00/ea', 'ILS')).toBeNull();
  });

  test('returns null for text without a price', () => {
    expect(parsePriceIn('Price not available', 'ILS')).toBeNull();
  });

  test('checks "US $50.00 (ILS 185.20)" against an ILS budget', () => {
    const price = parsePriceIn('US $50.00 (ILS 185.20)', 'ILS');
    expect(price).not.toBeNull();
    expect(isWithinBudget(price!, 100)).toBe(false);
    expect(isWithinBudget(price!, 200)).toBe(true);
  });
});
