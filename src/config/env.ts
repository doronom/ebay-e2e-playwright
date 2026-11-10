import dotenv from 'dotenv';
import { z } from 'zod';
import { profiles } from './profiles';

dotenv.config({ quiet: true });

const env = z
  .object({
    BASE_URL: z.url().default('https://www.ebay.com'),
    PROFILE: z.enum(['local', 'ci']).default(process.env.CI ? 'ci' : 'local'),
    STORAGE_STATE_PATH: z.string().default('.auth/state.json'),
    CLEAN_MODE: z.stringbool().default(false),
    HEADLESS: z.stringbool().optional(),
    PAUSE_ON_CAPTCHA: z.stringbool().default(false),
    SCENARIO_FILE: z.string().default('data/scenarios.json'),
    TZ_ID: z.string().min(1).default('Asia/Jerusalem'),
    EBAY_EMAIL: z.string().optional(),
    EBAY_PASSWORD: z.string().optional(),
  })
  .parse(process.env);

const profile = profiles[env.PROFILE];

export const config = {
  baseUrl: env.BASE_URL,
  profile: env.PROFILE,
  storageStatePath: env.STORAGE_STATE_PATH,
  cleanMode: env.CLEAN_MODE,
  ebayEmail: env.EBAY_EMAIL,
  ebayPassword: env.EBAY_PASSWORD,
  headless: env.HEADLESS ?? profile.headless,
  channel: profile.channel,
  pauseOnCaptcha: env.PAUSE_ON_CAPTCHA,
  scenarioFile: env.SCENARIO_FILE,
  maxSearchPages: profile.maxSearchPages,
  locale: 'en-US',
  timezoneId: env.TZ_ID,
};
