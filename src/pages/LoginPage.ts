import { expect } from '@playwright/test';
import { config } from '@config/env';
import { timeouts } from '@config/timeouts';
import { assertNoBotCheck, BotCheckError, isBotCheck } from '@utils/botCheck';
import { BasePage } from './BasePage';
import { loginLocators } from './locators/login.locators';

type SignInStep = 'challenge' | 'rejected' | 'verification' | 'signed in' | 'password' | 'pending';

const signInUrl = config.baseUrl.replace('://www.', '://signin.');
const blockingSteps: SignInStep[] = ['challenge', 'rejected', 'verification'];

export class LoginPage extends BasePage {
  private readonly locators = loginLocators(this.page);

  login(email: string, password: string) {
    return this.logger.step('Sign in to eBay', async () => {
      await this.goto(`${signInUrl}/`);
      await expect(this.locators.emailInput).toBeVisible();
      await this.locators.emailInput.fill(email);
      await this.locators.continueButton.click();
      await this.waitForStep('password', email);
      await this.locators.passwordInput.fill(password);
      await this.locators.signInButton.click();
      await this.waitForStep('signed in', email);
      await this.header.expectSignedIn();
    });
  }

  async saveSession(path: string) {
    await this.page.context().storageState({ path });
  }

  private async waitForStep(expected: SignInStep, email: string): Promise<void> {
    let step = 'pending' as SignInStep;
    await expect
      .poll(
        async () => {
          step = await this.currentStep();
          return step === expected || blockingSteps.includes(step);
        },
        { message: `sign-in step: ${expected}`, timeout: timeouts.navigation },
      )
      .toBe(true);
    if (step === 'challenge') {
      await assertNoBotCheck(this.page);
      return this.waitForStep(expected, email);
    }
    if (step === 'verification') throw new BotCheckError(`verification page at ${this.page.url()}`);
    if (step === 'rejected') {
      const message = (await this.locators.errorMessage.innerText()).replaceAll(email, '***').trim();
      throw new Error(`sign-in rejected: "${message}" (check EBAY_EMAIL/EBAY_PASSWORD)`);
    }
  }

  private async currentStep(): Promise<SignInStep> {
    if (await isBotCheck(this.page)) return 'challenge';
    if (await this.locators.errorMessage.isVisible()) return 'rejected';
    if (await this.locators.verificationHeading.isVisible()) return 'verification';
    if (new URL(this.page.url()).hostname !== new URL(signInUrl).hostname) return 'signed in';
    if (await this.locators.passwordInput.isVisible()) return 'password';
    return 'pending';
  }
}
