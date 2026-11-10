import type { Page } from '@playwright/test';

export const cartLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: 'Cart', level: 1 }),
  emptyMessage: page.getByText(/You don't have any items in your cart/i),
  itemsLine: page
    .locator('.cart-summary-line-item')
    .filter({ hasText: /^Items \(\d+\)/ })
    .locator('.val-col'),
  subtotal: page
    .locator('.cart-summary-line-item')
    .filter({ hasText: /^Subtotal/ })
    .locator('.val-col'),
  lineItems: page.locator('.cart-bucket-lineitem'),
  removeButton: page.locator('.cart-bucket-lineitem [data-test-id="cart-remove-item"]').first(),
});
