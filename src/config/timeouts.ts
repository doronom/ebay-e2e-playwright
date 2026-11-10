const ci = Boolean(process.env.CI);

export const timeouts = {
  test: ci ? 300_000 : 240_000,
  expect: ci ? 15_000 : 10_000,
  action: ci ? 20_000 : 15_000,
  navigation: ci ? 45_000 : 30_000,
  api: ci ? 20_000 : 15_000,
};
