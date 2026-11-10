import type { HomePage } from '@pages/HomePage';
import type { LoginPage } from '@pages/LoginPage';
import type { Logger } from '@utils/logger';

export class AuthFlow {
  constructor(
    private readonly homePage: HomePage,
    private readonly loginPage: LoginPage,
    private readonly hasSession: boolean,
    private readonly logger: Logger,
  ) {}

  login() {
    return this.logger.step(this.hasSession ? 'Login with saved session' : 'Login as guest', async () => {
      await this.homePage.open();
      if (!this.hasSession) {
        this.logger.info('guest mode');
        return;
      }
      await this.homePage.header.expectSignedIn();
      this.logger.info('signed in');
    });
  }

  signIn(email: string, password: string, path: string) {
    return this.logger.step('Sign in', async () => {
      await this.loginPage.login(email, password);
      await this.loginPage.saveSession(path);
    });
  }
}
