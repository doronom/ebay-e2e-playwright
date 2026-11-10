import { expect, type Locator } from '@playwright/test';
import { api } from '@config/api';
import { config } from '@config/env';
import { actAndWaitForApi } from '@utils/network';
import { parsePrice } from '@utils/priceParser';
import type { ParsedPrice } from '../types';
import { BasePage } from './BasePage';
import { cartLocators } from './locators/cart.locators';

interface CartTotal {
  text: string;
  price: ParsedPrice;
}

export class CartPage extends BasePage {
  private readonly locators = cartLocators(this.page);

  open() {
    return this.logger.step('Open cart', async () => {
      await this.goto(config.baseUrl.replace('://www.', '://cart.'));
      await expect(this.locators.heading.or(this.locators.emptyMessage).first()).toBeVisible();
    });
  }

  empty() {
    return this.logger.step('Empty cart', async () => {
      await this.open();
      for (let remaining = await this.locators.lineItems.count(); remaining > 0; remaining--) {
        await actAndWaitForApi(this.page, api.removeFromCart, () => this.locators.removeButton.click());
        await expect(this.locators.lineItems).toHaveCount(remaining - 1);
      }
      await expect(this.locators.emptyMessage).toBeVisible();
      this.logger.info('cart is empty');
    });
  }

  async expectItemCount(count: number) {
    await expect(this.locators.lineItems).toHaveCount(count);
  }

  getItemsTotal(currency: string) {
    return this.readTotal('items total', this.locators.itemsLine, currency);
  }

  getSubtotal(currency: string) {
    return this.readTotal('subtotal', this.locators.subtotal, currency);
  }

  private async readTotal(name: string, value: Locator, currency: string): Promise<CartTotal> {
    await expect(value).toBeVisible();
    const text = (await value.innerText()).replace(/\s+/g, ' ').trim();
    const price = parsePrice(text, currency);
    if (!price) throw new Error(`Cart ${name} "${text}" is not a price`);
    return { text, price };
  }
}
