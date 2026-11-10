import type { BrowserContext, Page, Request } from '@playwright/test';
import type { ApiMatcher } from '@config/api';
import { timeouts } from '@config/timeouts';
import { attachJson } from './attachments';

export async function actAndWaitForApi(page: Page, matcher: ApiMatcher, action: () => Promise<void>) {
  const responsePromise = page
    .waitForResponse((response) => response.request().method() === matcher.method && matcher.url.test(response.url()), {
      timeout: timeouts.api,
    })
    .catch(() => null);
  await action();
  const response = await responsePromise;
  if (response && !response.ok()) {
    throw new Error(`${matcher.method} ${response.url()} returned ${response.status()}`);
  }
  return response;
}

interface NetworkEntry {
  method: string;
  url: string;
  status: number;
  durationMs: number;
}

export class NetworkRecorder {
  private readonly entries: NetworkEntry[] = [];

  constructor(context: BrowserContext) {
    context.on('requestfinished', (request) => this.record(request));
    context.on('requestfailed', (request) => this.record(request));
  }

  async attach() {
    await attachJson('network-traffic.json', this.entries);
  }

  private async record(request: Request) {
    const url = new URL(request.url());
    if (!['xhr', 'fetch'].includes(request.resourceType()) || !url.hostname.endsWith('ebay.com')) return;
    const response = await request.response();
    this.entries.push({
      method: request.method(),
      url: url.origin + url.pathname,
      status: response?.status() ?? 0,
      durationMs: Math.max(0, Math.round(request.timing().responseEnd)),
    });
  }
}
