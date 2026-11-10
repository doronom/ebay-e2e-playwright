import * as allure from 'allure-js-commons';
import { config } from '@config/env';
import { loadScenarios } from '@data/scenarioSchema';
import { expect, test } from '@fixtures/index';

for (const scenario of loadScenarios(config.scenarioFile)) {
  test.describe(() => {
    test.use({ currency: scenario.currency });

    test(`purchase under budget: ${scenario.id}`, async ({ authFlow, searchFlow, cartFlow }) => {
      await allure.epic('eBay shopping');
      await allure.feature('Purchase under budget');
      await allure.severity('critical');
      await allure.parameter('query', scenario.query);
      await allure.parameter('maxPrice', `${scenario.maxPrice} ${scenario.currency}`);
      await allure.parameter('limit', String(scenario.limit));

      await authFlow.login();

      const urls = await searchFlow.searchItemsByNameUnderPrice(scenario.query, scenario.maxPrice, scenario.limit);
      if (scenario.expectEmpty) {
        expect(urls).toEqual([]);
        await searchFlow.expectNoResults();
        return;
      }
      expect(urls.length).toBeGreaterThan(0);

      await cartFlow.addItemsToCart(urls, scenario.maxPrice);
      if (cartFlow.skipped.length > 0) {
        await allure.attachment('skipped-items.txt', cartFlow.skipped.join('\n'), 'text/plain');
      }
      expect(cartFlow.added.length, 'At least one item was added to the cart').toBeGreaterThan(0);
      await cartFlow.assertCartTotalNotExceeds(scenario.maxPrice, cartFlow.added.length);
    });
  });
}
