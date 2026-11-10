import { expect } from '@playwright/test';
import { VariantSelector } from '@components/VariantSelector';
import { api } from '@config/api';
import { actAndWaitForApi } from '@utils/network';
import { parsePriceIn } from '@utils/priceParser';
import { BasePage } from './BasePage';
import { productLocators } from './locators/product.locators';

export class ProductPage extends BasePage {
  readonly variants = new VariantSelector(this.page, this.logger);
  private readonly locators = productLocators(this.page);

  open(url: string) {
    return this.logger.step(`Open item ${url}`, async () => {
      await this.header.dismissShippingPrompt();
      await this.goto(url);
      await expect(this.locators.title).toBeVisible();
    });
  }

  async isPurchasable() {
    await this.locators.addToCartButton
      .or(this.locators.unavailableNotice)
      .or(this.locators.placeBidButton)
      .filter({ visible: true })
      .first()
      .waitFor();
    if ((await this.locators.addToCartButton.isVisible()) && (await this.locators.addToCartButton.isEnabled())) {
      return true;
    }
    if (await this.locators.placeBidButton.isVisible()) this.logger.warn('auction listing, skipping');
    return false;
  }

  async getPrice(currency: string) {
    const texts: string[] = [];
    for (const locator of [this.locators.price, this.locators.approxPrice]) {
      if ((await locator.count()) > 0) texts.push(await locator.innerText());
    }
    return parsePriceIn(texts.join(' '), currency);
  }

  addToCart() {
    return this.logger.step('Add to cart', async () => {
      const response = await actAndWaitForApi(this.page, api.addToCart, () => this.locators.addToCartButton.click());
      if (!response) this.logger.warn('no add-to-cart response, checking dialog');
      await expect(this.locators.addedToCartDialog).toBeVisible();
    });
  }

  async close() {
    await this.page.close();
  }
}
