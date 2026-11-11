import { expect } from '@playwright/test';
import type { CartPage } from '@pages/CartPage';
import type { ProductPage } from '@pages/ProductPage';
import type { SearchResultsPage } from '@pages/SearchResultsPage';
import { attachJson } from '@utils/attachments';
import type { Logger } from '@utils/logger';
import { isWithinBudget } from '@utils/priceParser';

export class CartFlow {
  readonly added: string[] = [];
  readonly skipped: string[] = [];

  constructor(
    private readonly searchResultsPage: SearchResultsPage,
    private readonly cartPage: CartPage,
    private readonly currency: string,
    private readonly logger: Logger,
  ) {}

  async addItemsToCart(urls: string[], maxPrice?: number): Promise<void> {
    const searchUrl = this.searchResultsPage.url();
    for (const [index, url] of urls.entries()) {
      await this.logger.step(`Add item ${index + 1}/${urls.length}`, async () => {
        const productPage = await this.searchResultsPage.openItem(url);
        const available = (await productPage.isPurchasable()) && (await productPage.variants.selectRandom());
        if (!available) this.logger.warn(`skipped unavailable item: ${url}`);
        if (available && (maxPrice === undefined || (await this.checkPrice(productPage, url, maxPrice)))) {
          await productPage.addToCart();
          await productPage.screenshot(`item-${index + 1}-added.png`);
          this.added.push(url);
        } else {
          this.skipped.push(url);
          await productPage.screenshot(`item-${index + 1}-skipped.png`);
        }
        await productPage.close();
        await this.searchResultsPage.expectStillOn(searchUrl);
      });
    }
  }

  assertCartTotalNotExceeds(budgetPerItem: number, itemsCount: number): Promise<void> {
    return this.logger.step(`Cart total <= ${budgetPerItem} x ${itemsCount}`, async () => {
      await this.cartPage.open();
      await this.cartPage.screenshot('cart.png');
      await this.cartPage.expectItemCount(itemsCount);
      const itemsTotal = await this.cartPage.getItemsTotal(this.currency);
      const subtotal = await this.cartPage.getSubtotal(this.currency);
      const threshold = budgetPerItem * itemsCount;
      this.logger.info(`items total: ${itemsTotal.text} (max ${this.currency} ${threshold})`);
      this.logger.info(`subtotal: ${subtotal.text}`);
      await attachJson('cart-totals.json', {
        itemsTotal: itemsTotal.text,
        subtotal: subtotal.text,
        threshold: `${this.currency} ${threshold}`,
      });
      expect(itemsTotal.price.currency, 'items total currency').toBe(this.currency);
      expect(
        itemsTotal.price.value,
        `Cart items total ${itemsTotal.price.value} is at most ${threshold}`,
      ).toBeLessThanOrEqual(threshold);
    });
  }

  private checkPrice(productPage: ProductPage, url: string, maxPrice: number) {
    return this.logger.step(`Item price <= ${this.currency} ${maxPrice}`, async () => {
      const price = await productPage.getPrice(this.currency);
      if (!price) {
        this.logger.warn(`no ${this.currency} price, skipping item`);
        return false;
      }
      this.logger.info(`price: ${price.currency} ${price.value}`);
      if (isWithinBudget(price, maxPrice)) return true;
      this.logger.warn(`skipped item over budget (${price.currency} ${price.max} > ${maxPrice}): ${url}`);
      return false;
    });
  }
}
