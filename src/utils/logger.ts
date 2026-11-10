import { test, type TestInfo } from '@playwright/test';

export class Logger {
  constructor(private readonly testInfo: TestInfo) {}

  info(message: string) {
    console.log(message);
  }

  warn(message: string) {
    console.warn(`WARN ${message}`);
    this.testInfo.annotations.push({ type: 'warning', description: message });
  }

  step<T>(title: string, body: () => Promise<T>) {
    return test.step(title, () => {
      this.info(title);
      return body();
    });
  }
}
