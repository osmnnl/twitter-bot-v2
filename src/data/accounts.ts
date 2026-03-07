import { defaultScheduleProfile } from "../config/scheduleProfile.js";
import type { PublishingAccount } from "../domain/account.js";

export const accounts: PublishingAccount[] = [
  {
    accountId: "account1",
    twitterHandle: "@hesap1",
    envPrefix: "TWITTER_1",
    allowedCategories: ["Fiber İnternet", "Mobil Operatör", "Ev İnterneti"],
    scheduleProfile: defaultScheduleProfile,
  },
  {
    accountId: "account2",
    twitterHandle: "@hesap2",
    envPrefix: "TWITTER_2",
    allowedCategories: ["Bankacılık", "Sigorta"],
    scheduleProfile: defaultScheduleProfile,
  },
  {
    accountId: "account3",
    twitterHandle: "@hesap3",
    envPrefix: "TWITTER_3",
    allowedCategories: ["Seyahat", "Yeme & İçme", "Kozmetik", "Bankacılık"],
    scheduleProfile: defaultScheduleProfile,
  },
];
