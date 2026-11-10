import { existsSync } from 'node:fs';
import { test as base } from '@playwright/test';
import { config } from '@config/env';
import { AuthFlow } from '@flows/AuthFlow';
import { CartFlow } from '@flows/CartFlow';
import { SearchFlow } from '@flows/SearchFlow';
import { CartPage } from '@pages/CartPage';
import { HomePage } from '@pages/HomePage';
import { LoginPage } from '@pages/LoginPage';
import { SearchResultsPage } from '@pages/SearchResultsPage';
import { Logger } from '@utils/logger';
import { NetworkRecorder } from '@utils/network';

interface Options {
  currency: string;
  useSession: boolean;
}

interface Fixtures {
  hasSession: boolean;
  logger: Logger;
  networkRecorder: NetworkRecorder;
  homePage: HomePage;
  loginPage: LoginPage;
  searchResultsPage: SearchResultsPage;
  cartPage: CartPage;
  authFlow: AuthFlow;
  searchFlow: SearchFlow;
  cartFlow: CartFlow;
  emptyCart: void;
}

export const test = base.extend<Options & Fixtures>({
  currency: ['ILS', { option: true }],
  useSession: [true, { option: true }],
  storageState: async ({ useSession }, use) => {
    const applies = useSession && !config.cleanMode && existsSync(config.storageStatePath);
    await use(applies ? config.storageStatePath : undefined);
  },
  hasSession: async ({ storageState }, use) => {
    await use(Boolean(storageState));
  },
  logger: async ({}, use, testInfo) => {
    await use(new Logger(testInfo));
  },
  networkRecorder: [
    async ({ context }, use) => {
      const recorder = new NetworkRecorder(context);
      await use(recorder);
      await recorder.attach();
    },
    { auto: true },
  ],
  homePage: async ({ page, logger }, use) => {
    await use(new HomePage(page, logger));
  },
  loginPage: async ({ page, logger }, use) => {
    await use(new LoginPage(page, logger));
  },
  searchResultsPage: async ({ page, logger }, use) => {
    await use(new SearchResultsPage(page, logger));
  },
  cartPage: async ({ page, logger }, use) => {
    await use(new CartPage(page, logger));
  },
  authFlow: async ({ homePage, loginPage, hasSession, logger }, use) => {
    await use(new AuthFlow(homePage, loginPage, hasSession, logger));
  },
  searchFlow: async ({ homePage, searchResultsPage, currency, logger }, use) => {
    await use(new SearchFlow(homePage, searchResultsPage, currency, logger));
  },
  cartFlow: async ({ searchResultsPage, cartPage, currency, logger }, use) => {
    await use(new CartFlow(searchResultsPage, cartPage, currency, logger));
  },
  emptyCart: [
    async ({ hasSession, cartPage }, use) => {
      if (hasSession) await cartPage.empty();
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
