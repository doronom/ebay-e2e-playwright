import type { Frame, Page } from '@playwright/test';

export const botCheckLocators = (scope: Page | Frame) => ({
  verifyYourselfHeading: scope.getByRole('heading', { name: 'Please verify yourself to continue' }),
});
