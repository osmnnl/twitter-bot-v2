import type { ProductCategory } from "./product.js";
import type { ScheduleProfile } from "./schedule.js";

export interface PublishingAccount {
  accountId: string;
  twitterHandle: string;
  envPrefix: string;
  enabled?: boolean;
  allowedCategories: ProductCategory[];
  scheduleProfile: ScheduleProfile;
}
