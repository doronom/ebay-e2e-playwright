import type { Locator, Page } from '@playwright/test';

export const productLocators = (page: Page) => ({
  title: page.getByRole('heading', { level: 1 }),
  addToCartButton: page
    .locator('#atcBtn_btn_1')
    .or(page.getByRole('button', { name: 'Add to cart', exact: true }))
    .first(),
  placeBidButton: page.getByRole('button', { name: 'Place bid', exact: true }).first(),
  unavailableNotice: page
    .getByText(/out of stock|this listing (was|has) ended|no longer available/i)
    .and(page.locator(':not([role="option"], [role="option"] *, [role="listbox"] *)'))
    .filter({ visible: true })
    .first(),
  addedToCartDialog: page
    .getByRole('dialog', { name: 'Added to cart' })
    .or(page.locator('.x-atc-action__overlay'))
    .first(),
  price: page.getByTestId('x-price-primary').or(page.locator('.x-price-primary')).first(),
  approxPrice: page.getByTestId('x-price-approx').or(page.locator('.x-price-approx')).first(),
  variantDropdowns: page.getByTestId('x-msku-evo').locator('button[aria-haspopup="listbox"]'),
  variantOptions: (listboxId: string): Locator =>
    page
      .locator(`[id="${listboxId}"]`)
      .locator('[role="option"][data-sku-value-name]:not([aria-disabled="true"])')
      .filter({ hasNotText: /out of stock/i }),
});
