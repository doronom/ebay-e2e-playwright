import { expect, type Locator, type Page } from '@playwright/test';
import { productLocators } from '@pages/locators/product.locators';
import type { Logger } from '@utils/logger';

export class VariantSelector {
  private readonly locators: ReturnType<typeof productLocators>;

  constructor(
    page: Page,
    private readonly logger: Logger,
  ) {
    this.locators = productLocators(page);
  }

  selectRandom() {
    return this.logger.step('Pick variants', async () => {
      for (const dropdown of await this.locators.variantDropdowns.all()) {
        if (!(await this.selectRandomOption(dropdown))) return false;
      }
      return true;
    });
  }

  private async selectRandomOption(dropdown: Locator) {
    const name = (await dropdown.innerText()).split('\n')[0].replace(/:$/, '');
    if ((await dropdown.getAttribute('aria-expanded')) !== 'true') await dropdown.click();
    await expect(dropdown).toHaveAttribute('aria-expanded', 'true');

    const options = await this.locators.variantOptions(String(await dropdown.getAttribute('aria-controls'))).all();
    if (options.length === 0) {
      this.logger.warn(`no available option for ${name}`);
      return false;
    }

    const option = options[Math.floor(Math.random() * options.length)];
    const value = String(await option.getAttribute('data-sku-value-name'));
    await option.click();
    await expect(dropdown).toContainText(value);
    this.logger.info(`${name}: ${value}`);
    return true;
  }
}
