import type { ScheduleProfile } from "../domain/schedule.js";

export const defaultScheduleProfile: ScheduleProfile = {
  targetPostsPerDay: 24,
  allowedHours: Array.from({ length: 24 }, (_, index) => index),
  minGapHours: 2,
  randomDelayMinutes: 59,
};
