import type { Page } from '@playwright/test';

export const headerLocators = (page: Page) => {
  const shippingDialog = page.getByRole('dialog', { name: /Are you shipping to/ });
  return {
    root: page.locator('#gh'),
    searchInput: page.getByRole('combobox', { name: 'Search for anything' }).or(page.locator('#gh-ac')),
    searchButton: page.getByRole('button', { name: 'Search', exact: true }).or(page.locator('#gh-search-btn')),
    signInLink: page.locator('#gh').getByRole('link', { name: 'Sign in', exact: true }),
    shippingDialog,
    shippingDialogDismiss: shippingDialog.getByRole('button', { name: 'Dismiss' }),
  };
};
