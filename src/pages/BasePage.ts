import type { BrowserContext, Page } from '@playwright/test';
import { Header } from '@components/Header';
import { attachScreenshot } from '@utils/attachments';
import { assertNoBotCheck, isBotCheck } from '@utils/botCheck';
import type { Logger } from '@utils/logger';

const navigatedContexts = new WeakSet<BrowserContext>();

export abstract class BasePage {
  readonly header: Header;

  constructor(
    protected readonly page: Page,
    protected readonly logger: Logger,
  ) {
    this.header = new Header(page, logger);
  }

  async screenshot(name: string) {
    await attachScreenshot(this.page, name);
  }

  protected async goto(url: string) {
    const isFirstNavigation = !navigatedContexts.has(this.page.context());
    navigatedContexts.add(this.page.context());
    const response = await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    const status = response?.status();

    if (!isFirstNavigation) {
      await assertNoBotCheck(this.page, status);
      return;
    }
    let finalStatus = status;
    if (await isBotCheck(this.page, status)) {
      this.logger.warn(`bot check on first page (HTTP ${status ?? 'n/a'}), reloading`);
      finalStatus = (await this.page.reload({ waitUntil: 'domcontentloaded' }))?.status();
    }
    await assertNoBotCheck(this.page, finalStatus);
  }
}
