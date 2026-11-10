import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  open() {
    return this.logger.step('Open home page', async () => {
      await this.header.dismissShippingPrompt();
      await this.goto('/');
    });
  }
}
