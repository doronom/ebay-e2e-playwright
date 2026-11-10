import { expect, test } from '@playwright/test';
import { loadScenarios, parseScenarios } from '@data/scenarioSchema';

test('loads the scenario file', () => {
  const scenarios = loadScenarios('data/scenarios.json');
  expect(scenarios.length).toBeGreaterThan(0);
  for (const scenario of scenarios) {
    expect(scenario.limit).toBeGreaterThan(0);
  }
});

test('defaults limit and expectEmpty', () => {
  expect(parseScenarios([{ id: 'a', query: 'shoes', maxPrice: 10, currency: 'ILS' }])).toEqual([
    { id: 'a', query: 'shoes', maxPrice: 10, currency: 'ILS', limit: 5, expectEmpty: false },
  ]);
});

test('rejects an empty scenario list', () => {
  expect(() => parseScenarios([])).toThrow('Invalid scenarios');
});

test('reports the invalid field by path', () => {
  expect(() => parseScenarios([{ id: 'a', query: 'shoes', maxPrice: -1, currency: 'ILS' }])).toThrow(/maxPrice/);
});

test('rejects a non-numeric price', () => {
  expect(() => parseScenarios([{ id: 'a', query: 'shoes', maxPrice: '220', currency: 'ILS' }])).toThrow(/maxPrice/);
});

test('requires a three-letter currency code', () => {
  expect(() => parseScenarios([{ id: 'a', query: 'shoes', maxPrice: 10 }])).toThrow(/currency/);
  expect(() => parseScenarios([{ id: 'a', query: 'shoes', maxPrice: 10, currency: '$' }])).toThrow(/currency/);
});
