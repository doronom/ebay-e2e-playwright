import type { Page } from '@playwright/test';

export const loginLocators = (page: Page) => ({
  emailInput: page.locator('#userid'),
  continueButton: page.locator('#signin-continue-btn'),
  passwordInput: page.locator('#pass'),
  signInButton: page.locator('#sgnBt'),
  errorMessage: page
    .locator('#signin-form')
    .getByText(/not a match|doesn't match|couldn't find|incorrect|isn't right/i)
    .filter({ visible: true })
    .first(),
  verificationHeading: page
    .getByRole('heading', { name: /verify (it's|it is) you|verify your identity|enter the (security )?code|two-step/i })
    .filter({ visible: true })
    .first(),
});
