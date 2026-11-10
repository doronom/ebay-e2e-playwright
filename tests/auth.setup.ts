import { rmSync } from 'node:fs';
import { config } from '@config/env';
import { test as setup } from '@fixtures/index';
import { BotCheckError } from '@utils/botCheck';

rmSync(config.storageStatePath, { force: true });

setup.use({ useSession: false });
setup.skip(config.cleanMode, 'CLEAN_MODE is on');
setup.skip(!config.ebayEmail || !config.ebayPassword, 'no EBAY_EMAIL or EBAY_PASSWORD');

setup('sign in', async ({ authFlow }) => {
  try {
    await authFlow.signIn(String(config.ebayEmail), String(config.ebayPassword), config.storageStatePath);
  } catch (error) {
    setup.skip(error instanceof BotCheckError, `bot check at sign-in: ${(error as Error).message}`);
    throw error;
  }
});
